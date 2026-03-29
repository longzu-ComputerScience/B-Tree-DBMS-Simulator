"""Integration tests for the Database service and API."""

import pytest
from app.database import Database
from app.btree import BTree


class TestDatabaseAddStudent:
    def test_add_single_student(self):
        db = Database()
        ok, msg, events, record = db.add_student("S001", "Alice", "Female")
        assert ok
        assert "S001" in db.base_table
        assert db.id_index.search("S001") is not None
        assert db.name_index.search("Alice") is not None

    def test_add_duplicate_id_rejected(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        ok, msg, events, _ = db.add_student("S001", "Bob", "Male")
        assert not ok
        assert "already exists" in msg

    def test_add_duplicate_name_allowed(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        ok, msg, events, _ = db.add_student("S002", "Alice", "Male")
        assert ok
        bucket = db.name_index.search("Alice")
        assert bucket is not None
        assert set(bucket) == {"S001", "S002"}


class TestDatabaseDeleteStudent:
    def test_delete_existing(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        ok, msg, events, record = db.delete_student("S001")
        assert ok
        assert "S001" not in db.base_table
        assert db.id_index.search("S001") is None
        assert db.name_index.search("Alice") is None

    def test_delete_nonexistent(self):
        db = Database()
        ok, msg, _, _ = db.delete_student("S999")
        assert not ok

    def test_delete_one_of_duplicate_names(self):
        """Deleting one student with a shared name should keep the other."""
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.add_student("S002", "Alice", "Male")

        ok, msg, events, _ = db.delete_student("S001")
        assert ok
        assert "S001" not in db.base_table
        assert db.id_index.search("S001") is None

        # Name should still be in the tree with S002
        bucket = db.name_index.search("Alice")
        assert bucket is not None
        assert bucket == ["S002"]

    def test_delete_last_of_duplicate_names_removes_key(self):
        """When the last student with a name is deleted, the name key
        should be removed from the name B-Tree."""
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.add_student("S002", "Alice", "Male")

        db.delete_student("S001")
        db.delete_student("S002")

        assert db.name_index.search("Alice") is None


class TestDatabaseSearch:
    def test_search_by_id_found(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        student, path = db.search_by_id("S001")
        assert student is not None
        assert student.full_name == "Alice"
        assert len(path) > 0

    def test_search_by_id_not_found(self):
        db = Database()
        student, path = db.search_by_id("S999")
        assert student is None

    def test_search_by_name_found(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.add_student("S002", "Alice", "Male")
        students, path = db.search_by_name("Alice")
        assert len(students) == 2

    def test_search_by_name_not_found(self):
        db = Database()
        students, path = db.search_by_name("Nobody")
        assert len(students) == 0


class TestDatabaseConsistency:
    def test_consistency_after_adds(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.add_student("S002", "Bob", "Male")
        db.add_student("S003", "Alice", "Other")
        errors = db.check_consistency()
        assert errors == [], f"Consistency errors: {errors}"

    def test_consistency_after_deletes(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.add_student("S002", "Bob", "Male")
        db.add_student("S003", "Alice", "Other")
        db.delete_student("S002")
        errors = db.check_consistency()
        assert errors == [], f"Consistency errors: {errors}"


class TestDatabaseSeedReset:
    def test_seed_loads_data(self):
        db = Database()
        state = db.seed()
        assert len(state.base_table) == 7

    def test_reset_clears_data(self):
        db = Database()
        db.seed()
        state = db.reset()
        assert len(state.base_table) == 0
        assert state.id_tree is None
        assert state.name_tree is None


class TestDatabaseHistory:
    def test_history_records_add(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        assert len(db.history) == 1
        assert db.history[0].operation == "ADD"

    def test_history_records_delete(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        db.delete_student("S001")
        assert len(db.history) == 2
        assert db.history[1].operation == "DELETE"

    def test_history_snapshots_differ(self):
        db = Database()
        db.add_student("S001", "Alice", "Female")
        record = db.history[0]
        assert len(record.before.base_table) == 0
        assert len(record.after.base_table) == 1


class TestEndToEndScenario:
    """Full realistic scenario to verify correctness end-to-end."""

    def test_full_scenario(self):
        db = Database()

        # Add 7 students
        students = [
            ("S001", "Nguyen Van A", "Male"),
            ("S002", "Tran Thi B", "Female"),
            ("S003", "Le Van C", "Male"),
            ("S004", "Pham Thi D", "Female"),
            ("S005", "Nguyen Van A", "Male"),   # duplicate name
            ("S006", "Hoang Van E", "Male"),
            ("S007", "Vo Thi F", "Female"),
        ]
        for sid, name, gender in students:
            ok, msg, events, _ = db.add_student(sid, name, gender)
            assert ok, f"Failed to add {sid}: {msg}"

        # Verify table size
        assert len(db.base_table) == 7
        errors = db.check_consistency()
        assert errors == [], f"After adds: {errors}"

        # Verify duplicate name bucket
        bucket = db.name_index.search("Nguyen Van A")
        assert bucket is not None
        assert set(bucket) == {"S001", "S005"}

        # Reject duplicate ID
        ok, msg, events, _ = db.add_student("S001", "New Name", "Male")
        assert not ok

        # Delete S005 (one of duplicate names)
        ok, msg, _, _ = db.delete_student("S005")
        assert ok
        bucket = db.name_index.search("Nguyen Van A")
        assert bucket == ["S001"]
        errors = db.check_consistency()
        assert errors == [], f"After delete S005: {errors}"

        # Delete S003
        ok, msg, _, _ = db.delete_student("S003")
        assert ok
        assert db.name_index.search("Le Van C") is None
        errors = db.check_consistency()
        assert errors == [], f"After delete S003: {errors}"

        # Delete S006
        ok, msg, _, _ = db.delete_student("S006")
        assert ok
        errors = db.check_consistency()
        assert errors == [], f"After delete S006: {errors}"

        # Final state: S001, S002, S004, S007
        assert len(db.base_table) == 4
        assert set(db.base_table.keys()) == {"S001", "S002", "S004", "S007"}

        # Search by ID
        student, path = db.search_by_id("S001")
        assert student is not None
        assert student.full_name == "Nguyen Van A"

        # Search by name
        students, path = db.search_by_name("Tran Thi B")
        assert len(students) == 1
        assert students[0].student_id == "S002"

        # Search missing
        student, path = db.search_by_id("S003")
        assert student is None

        # Final consistency
        errors = db.check_consistency()
        assert errors == [], f"Final consistency: {errors}"

        # History should have 7 adds + 3 deletes = 10 entries
        assert len(db.history) == 10

        # Verify ID tree has exactly the remaining keys
        id_keys = set(db.id_index.get_all_keys())
        assert id_keys == {"S001", "S002", "S004", "S007"}

        # Verify Name tree keys match
        name_keys = db.name_index.get_all_keys()
        expected_names = {"Nguyen Van A", "Tran Thi B", "Pham Thi D", "Vo Thi F"}
        assert set(name_keys) == expected_names
