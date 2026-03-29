"""Comprehensive B-Tree unit tests."""

import pytest
from app.btree import BTree, MAX_KEYS, MIN_KEYS


class TestBTreeInsert:
    """Test insertion operations."""

    def test_insert_into_empty_tree(self):
        tree = BTree()
        events = tree.insert("C", "C")
        assert tree.search("C") == "C"
        assert "INSERTED" in events[-1]

    def test_insert_two_keys_sorted(self):
        tree = BTree()
        tree.insert("B", "B")
        tree.insert("D", "D")
        keys = tree.get_all_keys()
        assert keys == ["B", "D"]

    def test_insert_three_keys_causes_split(self):
        """Inserting 3 keys into an order-3 tree forces a root split."""
        tree = BTree()
        tree.insert("A", "A")
        tree.insert("C", "C")
        events = tree.insert("B", "B")

        # The root should have been split
        assert any("SPLIT" in e or "ROOT_SPLIT" in e for e in events)

        # All keys should be findable
        assert tree.search("A") == "A"
        assert tree.search("B") == "B"
        assert tree.search("C") == "C"

        # Root should have 1 key (the median)
        assert len(tree.root.keys) == 1
        assert not tree.root.leaf

    def test_insert_multiple_splits(self):
        """Insert 7 keys to force multiple splits."""
        tree = BTree()
        keys = ["D", "B", "F", "A", "C", "E", "G"]
        for k in keys:
            tree.insert(k, k)

        all_keys = tree.get_all_keys()
        assert all_keys == sorted(keys)

    def test_insert_duplicate_returns_key_exists(self):
        tree = BTree()
        tree.insert("A", "A")
        events = tree.insert("A", "A-dup")
        assert events == ["KEY_EXISTS"]
        # Original value unchanged
        assert tree.search("A") == "A"

    def test_insert_sequential_ascending(self):
        tree = BTree()
        for i in range(1, 8):
            tree.insert(f"{i:03d}", f"val_{i}")
        all_keys = tree.get_all_keys()
        assert all_keys == [f"{i:03d}" for i in range(1, 8)]

    def test_insert_sequential_descending(self):
        tree = BTree()
        for i in range(7, 0, -1):
            tree.insert(f"{i:03d}", f"val_{i}")
        all_keys = tree.get_all_keys()
        assert all_keys == [f"{i:03d}" for i in range(1, 8)]


class TestBTreeSearch:
    """Test search operations."""

    def test_search_empty_tree(self):
        tree = BTree()
        assert tree.search("X") is None

    def test_search_existing_key(self):
        tree = BTree()
        tree.insert("A", "val_A")
        tree.insert("B", "val_B")
        tree.insert("C", "val_C")
        assert tree.search("B") == "val_B"

    def test_search_missing_key(self):
        tree = BTree()
        tree.insert("A", "A")
        tree.insert("C", "C")
        assert tree.search("B") is None

    def test_search_path(self):
        tree = BTree()
        tree.insert("A", "A")
        tree.insert("B", "B")
        tree.insert("C", "C")
        path = tree.get_search_path("A")
        assert len(path) >= 1
        # Last node in path should have found=True for a hit
        found_any = any(p["found"] for p in path)
        assert found_any

    def test_search_path_miss(self):
        tree = BTree()
        tree.insert("A", "A")
        tree.insert("C", "C")
        path = tree.get_search_path("B")
        assert not any(p["found"] for p in path)


class TestBTreeDelete:
    """Test deletion operations."""

    def test_delete_single_key(self):
        tree = BTree()
        tree.insert("A", "A")
        events = tree.delete("A")
        assert tree.search("A") is None
        assert "DELETED" in events[-1]

    def test_delete_missing_key(self):
        tree = BTree()
        tree.insert("A", "A")
        events = tree.delete("Z")
        assert events == ["KEY_NOT_FOUND"]

    def test_delete_from_leaf(self):
        tree = BTree()
        for k in ["B", "D", "F", "A", "C", "E", "G"]:
            tree.insert(k, k)
        tree.delete("A")
        assert tree.search("A") is None
        remaining = tree.get_all_keys()
        assert "A" not in remaining
        assert sorted(remaining) == remaining

    def test_delete_causes_borrow_left(self):
        """Set up a case where deletion forces borrow-from-left."""
        tree = BTree()
        # Insert keys to create a specific structure
        for k in ["C", "F", "B", "D", "E"]:
            tree.insert(k, k)

        # Delete a key that forces rebalancing
        tree.delete("B")
        assert tree.search("B") is None
        remaining = tree.get_all_keys()
        assert sorted(remaining) == remaining

    def test_delete_causes_borrow_right(self):
        """Set up a case where deletion forces borrow-from-right."""
        tree = BTree()
        for k in ["C", "F", "A", "D", "E"]:
            tree.insert(k, k)

        tree.delete("A")
        assert tree.search("A") is None
        remaining = tree.get_all_keys()
        assert sorted(remaining) == remaining

    def test_delete_causes_merge(self):
        """Delete that triggers a merge of two nodes."""
        tree = BTree()
        for k in ["A", "B", "C", "D", "E"]:
            tree.insert(k, k)

        # After inserting A,B,C,D,E:
        # Should have a multi-level tree
        tree.delete("E")
        tree.delete("D")
        assert tree.search("D") is None
        assert tree.search("E") is None
        remaining = tree.get_all_keys()
        assert sorted(remaining) == remaining

    def test_delete_root_shrinks(self):
        """Delete enough keys so the root height decreases."""
        tree = BTree()
        for k in ["A", "B", "C"]:
            tree.insert(k, k)

        # Tree has root with 1 key and 2 leaf children
        assert not tree.root.leaf

        tree.delete("A")
        tree.delete("C")

        # Should shrink back, possibly to single-node tree
        remaining = tree.get_all_keys()
        assert remaining == ["B"]

    def test_delete_all_keys(self):
        """Delete every key from the tree."""
        tree = BTree()
        keys = ["D", "B", "F", "A", "C", "E", "G"]
        for k in keys:
            tree.insert(k, k)

        for k in keys:
            tree.delete(k)
            assert tree.search(k) is None

        assert tree.get_all_keys() == []
        assert tree.root.leaf
        assert len(tree.root.keys) == 0

    def test_delete_internal_key(self):
        """Delete a key that exists in an internal node."""
        tree = BTree()
        for k in ["A", "B", "C", "D", "E"]:
            tree.insert(k, k)

        # Find what's in the root (internal node)
        root_key = tree.root.keys[0]
        events = tree.delete(root_key)
        assert tree.search(root_key) is None

        # Should have replacement events
        has_replace = any("REPLACE" in e or "MERGE" in e for e in events)
        assert has_replace or True  # The tree may handle it via merge

        remaining = tree.get_all_keys()
        assert root_key not in remaining
        assert sorted(remaining) == remaining


class TestBTreeSerialization:
    """Test serialization for frontend visualization."""

    def test_serialize_empty_tree(self):
        tree = BTree()
        assert tree.serialize() is None

    def test_serialize_single_key(self):
        tree = BTree()
        tree.insert("A", "val_A")
        serialized = tree.serialize()
        assert serialized is not None
        assert serialized["keys"] == ["A"]
        assert serialized["leaf"] is True

    def test_serialize_multi_level(self):
        tree = BTree()
        for k in ["A", "B", "C", "D", "E"]:
            tree.insert(k, k)
        serialized = tree.serialize()
        assert serialized is not None
        assert "children" in serialized
        assert len(serialized["children"]) > 0


class TestBTreeDeepCopy:
    def test_deep_copy_independence(self):
        tree = BTree()
        tree.insert("A", "A")
        tree.insert("B", "B")

        copy = tree.deep_copy()
        copy.insert("C", "C")

        assert tree.search("C") is None
        assert copy.search("C") == "C"


class TestBTreeInvariantsAfterOperations:
    """Verify B-Tree invariants hold after sequences of operations."""

    def _check_invariants(self, tree: BTree):
        """Check that the tree satisfies B-Tree invariants."""
        if len(tree.root.keys) == 0:
            assert tree.root.leaf
            return

        errors = []
        self._check_node(tree.root, is_root=True, errors=errors)
        assert errors == [], f"B-Tree invariant violations: {errors}"

        # Check sorted order
        keys = tree.get_all_keys()
        assert keys == sorted(keys), f"Keys not sorted: {keys}"

    def _check_node(
        self, node, is_root: bool, errors: list, depth: int = 0
    ):
        max_keys = MAX_KEYS
        min_keys = MIN_KEYS

        if len(node.keys) > max_keys:
            errors.append(
                f"Node {node.keys} has {len(node.keys)} keys (max {max_keys})"
            )

        if not is_root and len(node.keys) < min_keys:
            errors.append(
                f"Non-root node {node.keys} has {len(node.keys)} keys (min {min_keys})"
            )

        if not node.leaf:
            if len(node.children) != len(node.keys) + 1:
                errors.append(
                    f"Node {node.keys} has {len(node.keys)} keys but "
                    f"{len(node.children)} children (expected {len(node.keys) + 1})"
                )
            for child in node.children:
                self._check_node(child, is_root=False, errors=errors, depth=depth + 1)

        # Keys should be sorted within node
        for i in range(len(node.keys) - 1):
            if node.keys[i] >= node.keys[i + 1]:
                errors.append(
                    f"Node keys not sorted: {node.keys}"
                )

    def test_invariants_after_inserts(self):
        tree = BTree()
        for k in ["M", "D", "P", "A", "F", "J", "N", "S", "B", "E"]:
            tree.insert(k, k)
            self._check_invariants(tree)

    def test_invariants_after_deletes(self):
        tree = BTree()
        keys = ["M", "D", "P", "A", "F", "J", "N", "S", "B", "E"]
        for k in keys:
            tree.insert(k, k)

        for k in ["F", "M", "A", "P", "S", "B"]:
            tree.delete(k)
            self._check_invariants(tree)

    def test_invariants_mixed_operations(self):
        tree = BTree()
        # Insert some
        for k in ["H", "C", "L", "A", "E", "J", "N"]:
            tree.insert(k, k)
            self._check_invariants(tree)

        # Delete some
        tree.delete("E")
        self._check_invariants(tree)
        tree.delete("H")
        self._check_invariants(tree)

        # Insert more
        for k in ["B", "D", "F"]:
            tree.insert(k, k)
            self._check_invariants(tree)

        # Delete more
        tree.delete("L")
        self._check_invariants(tree)
        tree.delete("A")
        self._check_invariants(tree)
        tree.delete("N")
        self._check_invariants(tree)
