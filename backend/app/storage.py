"""JSON persistence for the database state."""

from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Any

from .btree import BTree, BTreeNode
from .models import Student, OperationRecord, SystemSnapshot

STORAGE_DIR = Path(__file__).parent.parent / "data"
STORAGE_FILE = STORAGE_DIR / "db_state.json"


def save_state(
    base_table: dict[str, Student],
    id_index: BTree,
    name_index: BTree,
    history: list[OperationRecord],
) -> None:
    """Persist the full state to a JSON file."""
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    data = {
        "base_table": {
            sid: s.model_dump() for sid, s in base_table.items()
        },
        "id_tree": _serialize_tree(id_index),
        "name_tree": _serialize_tree(name_index),
        "history": [op.model_dump() for op in history],
    }

    with open(STORAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_state(
    db: Any,  # Database instance
) -> bool:
    """
    Load state from JSON file into the database.
    Returns True if state was loaded, False if no file exists.
    """
    if not STORAGE_FILE.exists():
        return False

    try:
        with open(STORAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Restore base table
        db.base_table = {
            sid: Student(**sdata)
            for sid, sdata in data.get("base_table", {}).items()
        }

        # Restore ID tree
        tree_data = data.get("id_tree")
        if tree_data and tree_data.get("root"):
            db.id_index = BTree()
            db.id_index.root = _deserialize_node(tree_data["root"])
        else:
            db.id_index = BTree()

        # Restore Name tree
        tree_data = data.get("name_tree")
        if tree_data and tree_data.get("root"):
            db.name_index = BTree()
            db.name_index.root = _deserialize_node(tree_data["root"])
        else:
            db.name_index = BTree()

        # Restore history
        db.history = [
            OperationRecord(**op) for op in data.get("history", [])
        ]

        return True
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"Warning: Failed to load state, starting fresh: {e}")
        return False


def _serialize_tree(tree: BTree) -> dict:
    """Serialize a BTree to a dict for JSON storage."""
    return {"root": _serialize_node(tree.root)}


def _serialize_node(node: BTreeNode) -> dict:
    return {
        "keys": node.keys,
        "values": node.values,
        "leaf": node.leaf,
        "children": [_serialize_node(c) for c in node.children],
    }


def _deserialize_node(data: dict) -> BTreeNode:
    node = BTreeNode(leaf=data.get("leaf", True))
    node.keys = data.get("keys", [])
    node.values = data.get("values", [])
    node.children = [
        _deserialize_node(c) for c in data.get("children", [])
    ]
    return node
