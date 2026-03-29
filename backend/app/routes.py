"""FastAPI route definitions."""

from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from .models import (
    AddStudentRequest,
    MutationResponse,
    SearchResult,
    SystemStateResponse,
)
from .database import Database
from . import storage

router = APIRouter()

# Singleton database instance
db = Database()


def get_db() -> Database:
    return db


def _build_state_response() -> SystemStateResponse:
    return db.get_state()


def _persist():
    storage.save_state(db.base_table, db.id_index, db.name_index, db.history)


# ────────────────────────────────────────────────
# STATE
# ────────────────────────────────────────────────

@router.get("/state", response_model=SystemStateResponse)
def get_state():
    """Return the full current system state."""
    return _build_state_response()


# ────────────────────────────────────────────────
# ADD STUDENT
# ────────────────────────────────────────────────

@router.post("/students", response_model=MutationResponse)
def add_student(req: AddStudentRequest):
    """Add a new student record."""
    success, message, events, record = db.add_student(
        req.student_id, req.full_name, req.gender
    )
    if not success:
        raise HTTPException(status_code=409, detail=message)

    _persist()
    return MutationResponse(
        success=True,
        message=message,
        state=_build_state_response(),
        operation=record,
    )


# ────────────────────────────────────────────────
# DELETE STUDENT
# ────────────────────────────────────────────────

@router.delete("/students/{student_id}", response_model=MutationResponse)
def delete_student(student_id: str):
    """Delete a student by ID."""
    success, message, events, record = db.delete_student(student_id)
    if not success:
        raise HTTPException(status_code=404, detail=message)

    _persist()
    return MutationResponse(
        success=True,
        message=message,
        state=_build_state_response(),
        operation=record,
    )


# ────────────────────────────────────────────────
# SEARCH
# ────────────────────────────────────────────────

@router.get("/students/search/by-id/{student_id}", response_model=SearchResult)
def search_by_id(student_id: str):
    """Search for a student by Student ID using the ID B-Tree."""
    student, path = db.search_by_id(student_id)
    if student:
        return SearchResult(
            found=True,
            students=[student],
            search_path=path,
            message=f"Found student '{student_id}'",
        )
    return SearchResult(
        found=False,
        students=[],
        search_path=path,
        message=f"Student '{student_id}' not found",
    )


@router.get("/students/search/by-name", response_model=SearchResult)
def search_by_name(name: str = Query(..., description="Full name to search")):
    """Search for students by Full Name using the Name B-Tree."""
    students, path = db.search_by_name(name)
    if students:
        return SearchResult(
            found=True,
            students=students,
            search_path=path,
            message=f"Found {len(students)} student(s) with name '{name}'",
        )
    return SearchResult(
        found=False,
        students=[],
        search_path=path,
        message=f"No students found with name '{name}'",
    )


# ────────────────────────────────────────────────
# SEED / RESET
# ────────────────────────────────────────────────

@router.post("/seed", response_model=SystemStateResponse)
def seed_data():
    """Load demo data."""
    state = db.seed()
    _persist()
    return state


@router.post("/reset", response_model=SystemStateResponse)
def reset_data():
    """Clear all data."""
    state = db.reset()
    _persist()
    return state


# ────────────────────────────────────────────────
# HISTORY
# ────────────────────────────────────────────────

@router.get("/history")
def get_history():
    """Return the operation history."""
    return db.history
