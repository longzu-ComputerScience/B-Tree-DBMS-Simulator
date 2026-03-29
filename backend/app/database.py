"""
Database service: orchestrates the base table, ID index, and Name index.
Source of truth is the base table. Both B-Trees are maintained in sync.
"""

from __future__ import annotations
import copy
from typing import Optional
from .btree import BTree
from .models import (
    Student,
    SystemSnapshot,
    OperationRecord,
    SystemStateResponse,
)


# ────────────────────────────────────────────────
# Default seed data for demo
# ────────────────────────────────────────────────
SEED_STUDENTS = [
    Student(student_id="S001", full_name="Nguyen Van A", gender="Male"),
    Student(student_id="S002", full_name="Tran Thi B", gender="Female"),
    Student(student_id="S003", full_name="Le Van C", gender="Male"),
    Student(student_id="S004", full_name="Pham Thi D", gender="Female"),
    Student(student_id="S005", full_name="Nguyen Van A", gender="Male"),  # duplicate name
    Student(student_id="S006", full_name="Hoang Van E", gender="Male"),
    Student(student_id="S007", full_name="Vo Thi F", gender="Female"),
]


class Database:
    """Manages the student base table and dual B-Tree indexes."""

    def __init__(self):
        self.base_table: dict[str, Student] = {}  # student_id → Student
        self.id_index: BTree = BTree()
        self.name_index: BTree = BTree()
        self.history: list[OperationRecord] = []

    # ──────────── Snapshot helpers ──────────────

    def _snapshot(self) -> SystemSnapshot:
        return SystemSnapshot(
            base_table=list(self.base_table.values()),
            id_tree=self.id_index.serialize(),
            name_tree=self.name_index.serialize(),
        )

    def get_state(self) -> SystemStateResponse:
        snap = self._snapshot()
        return SystemStateResponse(
            base_table=snap.base_table,
            id_tree=snap.id_tree,
            name_tree=snap.name_tree,
            history=list(self.history),
        )

    # ──────────── ADD STUDENT ──────────────

    def add_student(
        self, student_id: str, full_name: str, gender: str
    ) -> tuple[bool, str, list[str], Optional[OperationRecord]]:
        """
        Add a student. Returns (success, message, events, operation_record).
        """
        # Reject duplicate ID
        if student_id in self.base_table:
            return (
                False,
                f"Student ID '{student_id}' already exists",
                ["DUPLICATE_ID"],
                None,
            )

        before = self._snapshot()

        student = Student(
            student_id=student_id, full_name=full_name, gender=gender
        )
        all_events: list[str] = []

        # 1. Insert into base table
        self.base_table[student_id] = student

        # 2. Insert into ID index
        id_events = self.id_index.insert(student_id, student_id)
        all_events.extend([f"[ID-Tree] {e}" for e in id_events])

        # 3. Insert into Name index
        existing_bucket = self.name_index.search(full_name)
        if existing_bucket is not None:
            # Name already exists — add student_id to the bucket
            existing_bucket.append(student_id)
            all_events.append(
                f"[Name-Tree] BUCKET_UPDATE: Added '{student_id}' to "
                f"existing bucket for name '{full_name}'"
            )
        else:
            # New name — insert into name B-Tree
            name_events = self.name_index.insert(full_name, [student_id])
            all_events.extend([f"[Name-Tree] {e}" for e in name_events])

        after = self._snapshot()

        record = OperationRecord(
            operation="ADD",
            input_data={
                "student_id": student_id,
                "full_name": full_name,
                "gender": gender,
            },
            before=before,
            after=after,
            events=all_events,
        )
        self.history.append(record)

        return (True, f"Student '{student_id}' added successfully", all_events, record)

    # ──────────── DELETE STUDENT ──────────────

    def delete_student(
        self, student_id: str
    ) -> tuple[bool, str, list[str], Optional[OperationRecord]]:
        """
        Delete a student by ID. Returns (success, message, events, operation_record).
        """
        if student_id not in self.base_table:
            return (
                False,
                f"Student ID '{student_id}' not found",
                ["NOT_FOUND"],
                None,
            )

        before = self._snapshot()

        student = self.base_table[student_id]
        full_name = student.full_name
        all_events: list[str] = []

        # 1. Remove from base table
        del self.base_table[student_id]

        # 2. Remove from ID index
        id_events = self.id_index.delete(student_id)
        all_events.extend([f"[ID-Tree] {e}" for e in id_events])

        # 3. Remove from Name index bucket
        name_bucket = self.name_index.search(full_name)
        if name_bucket is not None:
            if student_id in name_bucket:
                name_bucket.remove(student_id)
                all_events.append(
                    f"[Name-Tree] BUCKET_REMOVE: Removed '{student_id}' from "
                    f"bucket for name '{full_name}'"
                )

            if len(name_bucket) == 0:
                # Bucket is empty — remove the name key from the B-Tree
                all_events.append(
                    f"[Name-Tree] BUCKET_EMPTY: Name '{full_name}' has no more "
                    f"students, removing key from Name B-Tree"
                )
                name_events = self.name_index.delete(full_name)
                all_events.extend([f"[Name-Tree] {e}" for e in name_events])

        after = self._snapshot()

        record = OperationRecord(
            operation="DELETE",
            input_data={"student_id": student_id, "full_name": full_name},
            before=before,
            after=after,
            events=all_events,
        )
        self.history.append(record)

        return (True, f"Student '{student_id}' deleted successfully", all_events, record)

    # ──────────── SEARCH ──────────────

    def search_by_id(self, student_id: str) -> tuple[Optional[Student], list[dict]]:
        """Search by student ID using the ID B-Tree. Returns (student, search_path)."""
        path = self.id_index.get_search_path(student_id)
        result = self.id_index.search(student_id)
        if result is not None and student_id in self.base_table:
            return self.base_table[student_id], path
        return None, path

    def search_by_name(self, full_name: str) -> tuple[list[Student], list[dict]]:
        """Search by full name using the Name B-Tree. Returns (students, search_path)."""
        path = self.name_index.get_search_path(full_name)
        bucket = self.name_index.search(full_name)
        if bucket is not None:
            students = [
                self.base_table[sid]
                for sid in bucket
                if sid in self.base_table
            ]
            return students, path
        return [], path

    # ──────────── SEED / RESET ──────────────

    def seed(self) -> SystemStateResponse:
        """Load demo data."""
        self.reset()
        for s in SEED_STUDENTS:
            self.add_student(s.student_id, s.full_name, s.gender)
        return self.get_state()

    def reset(self) -> SystemStateResponse:
        """Clear everything."""
        self.base_table.clear()
        self.id_index = BTree()
        self.name_index = BTree()
        self.history.clear()
        return self.get_state()

    # ──────────── CONSISTENCY CHECK (for testing) ──────────────

    def check_consistency(self) -> list[str]:
        """Verify that base table and both indexes are in sync."""
        errors: list[str] = []

        # Check ID index has exactly the keys in base table
        id_keys = set(self.id_index.get_all_keys())
        table_keys = set(self.base_table.keys())
        if id_keys != table_keys:
            errors.append(
                f"ID index keys {id_keys} != base table keys {table_keys}"
            )

        # Check Name index buckets are consistent
        name_keys = self.name_index.get_all_keys()
        for name_key in name_keys:
            bucket = self.name_index.search(name_key)
            if bucket is None:
                errors.append(f"Name key '{name_key}' found in traversal but search returned None")
                continue
            for sid in bucket:
                if sid not in self.base_table:
                    errors.append(
                        f"Name bucket for '{name_key}' contains '{sid}' "
                        f"but it's not in the base table"
                    )
                elif self.base_table[sid].full_name != name_key:
                    errors.append(
                        f"Name bucket for '{name_key}' contains '{sid}' "
                        f"but that student's name is '{self.base_table[sid].full_name}'"
                    )

        # Check every student in base table has their name in the name index
        name_to_ids: dict[str, set[str]] = {}
        for sid, student in self.base_table.items():
            name_to_ids.setdefault(student.full_name, set()).add(sid)

        for name, expected_ids in name_to_ids.items():
            bucket = self.name_index.search(name)
            if bucket is None:
                errors.append(
                    f"Name '{name}' exists in base table but not in name index"
                )
            else:
                actual_ids = set(bucket)
                if actual_ids != expected_ids:
                    errors.append(
                        f"Name bucket for '{name}': expected {expected_ids}, got {actual_ids}"
                    )

        return errors
