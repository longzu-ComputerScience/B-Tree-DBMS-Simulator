"""Pydantic models for request/response validation and serialization."""

from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, field_validator


class AddStudentRequest(BaseModel):
    student_id: str
    full_name: str
    gender: str

    @field_validator("student_id")
    @classmethod
    def student_id_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Student ID must not be empty")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full Name must not be empty")
        return v

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        v = v.strip()
        allowed = {"Male", "Female", "Other"}
        if v not in allowed:
            raise ValueError(f"Gender must be one of {allowed}")
        return v


class Student(BaseModel):
    student_id: str
    full_name: str
    gender: str


class TreeNodeSchema(BaseModel):
    keys: list[str]
    values: list[Any]
    leaf: bool
    children: list["TreeNodeSchema"]


class SystemSnapshot(BaseModel):
    """A point-in-time snapshot of the entire system."""
    base_table: list[Student]
    id_tree: Optional[dict] = None
    name_tree: Optional[dict] = None


class OperationRecord(BaseModel):
    """A log entry for one mutation operation."""
    operation: str  # "ADD" | "DELETE"
    input_data: dict
    before: SystemSnapshot
    after: SystemSnapshot
    events: list[str]


class SystemStateResponse(BaseModel):
    """Full current state returned to the frontend."""
    base_table: list[Student]
    id_tree: Optional[dict] = None
    name_tree: Optional[dict] = None
    history: list[OperationRecord] = []


class MutationResponse(BaseModel):
    """Response after a mutation (add/delete)."""
    success: bool
    message: str
    state: SystemStateResponse
    operation: Optional[OperationRecord] = None


class SearchResult(BaseModel):
    """Response for search operations."""
    found: bool
    students: list[Student] = []
    search_path: list[dict] = []
    message: str = ""
