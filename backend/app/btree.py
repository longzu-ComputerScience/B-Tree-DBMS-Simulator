"""
B-Tree implementation for Order-3 (2-3 Tree).
- Max children per node: 3 (order)
- Max keys per node: 2 (order - 1)
- Min keys for non-root: 1 (⌈order/2⌉ - 1)
- Root can have 1 key minimum (or 0 if tree is empty)

APPROACH: Bottom-up rebalancing.
- Insert: insert into leaf, if overflows (3 keys) → split upward.
- Delete: delete from leaf (replacing with pred/succ if in internal),
  then if underflows (0 keys) → rebalance upward (borrow or merge).

For Order-3, merge of underflowing node (0 keys) + separator (1 key) 
+ sibling (1 key) = exactly 2 keys = MAX_KEYS. This is correct.
"""

from __future__ import annotations
import copy
from typing import Any, Optional


ORDER = 3
MAX_KEYS = ORDER - 1     # 2
MIN_KEYS = (ORDER + 1) // 2 - 1  # 1


class BTreeNode:
    """A single node in the B-Tree."""

    def __init__(self, leaf: bool = True):
        self.keys: list[str] = []
        self.values: list[Any] = []
        self.children: list[BTreeNode] = []
        self.leaf: bool = leaf

    def serialize(self) -> dict:
        return {
            "keys": list(self.keys),
            "values": [
                list(v) if isinstance(v, list) else v for v in self.values
            ],
            "leaf": self.leaf,
            "children": [child.serialize() for child in self.children],
        }


class BTree:
    """Order-3 B-Tree (2-3 Tree)."""

    def __init__(self):
        self.root: BTreeNode = BTreeNode(leaf=True)

    # ──── SEARCH ────

    def search(self, key: str) -> Optional[Any]:
        node, idx = self._search_node(self.root, key)
        return node.values[idx] if node else None

    def _search_node(
        self, node: BTreeNode, key: str
    ) -> tuple[Optional[BTreeNode], int]:
        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1
        if i < len(node.keys) and key == node.keys[i]:
            return node, i
        if node.leaf:
            return None, -1
        return self._search_node(node.children[i], key)

    def get_search_path(self, key: str) -> list[dict]:
        path: list[dict] = []
        self._trace_search(self.root, key, path)
        return path

    def _trace_search(self, node: BTreeNode, key: str, path: list[dict]) -> bool:
        path.append({"keys": list(node.keys), "found": False})
        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1
        if i < len(node.keys) and key == node.keys[i]:
            path[-1]["found"] = True
            return True
        if node.leaf:
            return False
        return self._trace_search(node.children[i], key, path)

    # ──── INSERTION (bottom-up split) ────

    def insert(self, key: str, value: Any) -> list[str]:
        """Insert key-value. Returns event list. ["KEY_EXISTS"] if duplicate."""
        events: list[str] = []
        if self.search(key) is not None:
            return ["KEY_EXISTS"]

        self._insert_recursive(self.root, key, value, events)

        if len(self.root.keys) > MAX_KEYS:
            old_root = self.root
            new_root = BTreeNode(leaf=False)
            new_root.children.append(old_root)
            self._split_child(new_root, 0, events)
            self.root = new_root
            events.append("ROOT_SPLIT: Root was full, created new root")

        events.append(f"INSERTED: key='{key}'")
        return events

    def _insert_recursive(
        self, node: BTreeNode, key: str, value: Any, events: list[str]
    ) -> None:
        if node.leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            node.keys.insert(i, key)
            node.values.insert(i, value)
            return

        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1

        self._insert_recursive(node.children[i], key, value, events)

        if len(node.children[i].keys) > MAX_KEYS:
            self._split_child(node, i, events)

    def _split_child(
        self, parent: BTreeNode, idx: int, events: list[str]
    ) -> None:
        """Split parent.children[idx] which has > MAX_KEYS keys (overflow)."""
        child = parent.children[idx]
        mid = len(child.keys) // 2

        mid_key = child.keys[mid]
        mid_value = child.values[mid]

        right = BTreeNode(leaf=child.leaf)
        right.keys = child.keys[mid + 1:]
        right.values = child.values[mid + 1:]

        child.keys = child.keys[:mid]
        child.values = child.values[:mid]

        if not child.leaf:
            right.children = child.children[mid + 1:]
            child.children = child.children[:mid + 1]

        parent.keys.insert(idx, mid_key)
        parent.values.insert(idx, mid_value)
        parent.children.insert(idx + 1, right)

        events.append(f"SPLIT: Node split, key '{mid_key}' promoted to parent")

    # ──── DELETION (bottom-up rebalancing) ────

    def delete(self, key: str) -> list[str]:
        """Delete key. Returns event list."""
        events: list[str] = []
        if self.search(key) is None:
            return ["KEY_NOT_FOUND"]

        self._delete_recursive(self.root, key, events)

        # Root may be empty after merge — shrink
        if len(self.root.keys) == 0 and not self.root.leaf:
            self.root = self.root.children[0]
            events.append(
                f"ROOT_SHRINK: Root empty, replaced by child. New root keys: {self.root.keys}"
            )

        events.append(f"DELETED: key='{key}'")
        return events

    def _delete_recursive(
        self, node: BTreeNode, key: str, events: list[str]
    ) -> None:
        """Delete key from the subtree rooted at node, then rebalance."""
        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1

        if node.leaf:
            if i < len(node.keys) and node.keys[i] == key:
                node.keys.pop(i)
                node.values.pop(i)
            return

        if i < len(node.keys) and node.keys[i] == key:
            # Key is in this internal node — replace with predecessor
            pred_node = self._get_predecessor_leaf(node.children[i])
            pred_key = pred_node.keys[-1]
            pred_value = pred_node.values[-1]
            node.keys[i] = pred_key
            node.values[i] = pred_value
            events.append(
                f"REPLACE_PREDECESSOR: Replaced '{key}' with predecessor '{pred_key}'"
            )
            # Now delete the predecessor from the left subtree
            self._delete_recursive(node.children[i], pred_key, events)
            # After deleting from children[i], check if it underflowed
            if len(node.children[i].keys) < MIN_KEYS:
                self._rebalance(node, i, events)
        else:
            # Key is in subtree at children[i]
            self._delete_recursive(node.children[i], key, events)
            # After deleting from children[i], check if it underflowed
            if i < len(node.children) and len(node.children[i].keys) < MIN_KEYS:
                self._rebalance(node, i, events)

    def _rebalance(
        self, parent: BTreeNode, idx: int, events: list[str]
    ) -> None:
        """
        Rebalance parent.children[idx] which has underflowed (< MIN_KEYS keys).
        Try borrow from siblings first, then merge.
        """
        # Try borrow from left sibling
        if idx > 0 and len(parent.children[idx - 1].keys) > MIN_KEYS:
            self._borrow_from_left(parent, idx, events)
        # Try borrow from right sibling
        elif (
            idx < len(parent.children) - 1
            and len(parent.children[idx + 1].keys) > MIN_KEYS
        ):
            self._borrow_from_right(parent, idx, events)
        # Must merge
        else:
            if idx < len(parent.children) - 1:
                self._merge(parent, idx, events)
            else:
                self._merge(parent, idx - 1, events)

    def _borrow_from_left(
        self, parent: BTreeNode, idx: int, events: list[str]
    ) -> None:
        child = parent.children[idx]
        left = parent.children[idx - 1]

        child.keys.insert(0, parent.keys[idx - 1])
        child.values.insert(0, parent.values[idx - 1])

        parent.keys[idx - 1] = left.keys.pop()
        parent.values[idx - 1] = left.values.pop()

        if not left.leaf:
            child.children.insert(0, left.children.pop())

        events.append(f"BORROW_LEFT: Borrowed key '{child.keys[0]}' from left sibling")

    def _borrow_from_right(
        self, parent: BTreeNode, idx: int, events: list[str]
    ) -> None:
        child = parent.children[idx]
        right = parent.children[idx + 1]

        child.keys.append(parent.keys[idx])
        child.values.append(parent.values[idx])

        parent.keys[idx] = right.keys.pop(0)
        parent.values[idx] = right.values.pop(0)

        if not right.leaf:
            child.children.append(right.children.pop(0))

        events.append(f"BORROW_RIGHT: Borrowed key '{child.keys[-1]}' from right sibling")

    def _merge(
        self, parent: BTreeNode, idx: int, events: list[str]
    ) -> None:
        """
        Merge parent.children[idx] and parent.children[idx+1]
        with parent.keys[idx] as the separator.
        For Order-3: child(0-1 keys) + sep(1) + sibling(1 key) = 2 keys max.
        """
        left = parent.children[idx]
        right = parent.children[idx + 1]
        merge_key = parent.keys[idx]

        left.keys.append(parent.keys.pop(idx))
        left.values.append(parent.values.pop(idx))

        left.keys.extend(right.keys)
        left.values.extend(right.values)
        if not right.leaf:
            left.children.extend(right.children)

        parent.children.pop(idx + 1)

        events.append(
            f"MERGE: Merged around key '{merge_key}', result keys: {left.keys}"
        )

    def _get_predecessor_leaf(self, node: BTreeNode) -> BTreeNode:
        """Return the leaf node containing the predecessor (rightmost)."""
        current = node
        while not current.leaf:
            current = current.children[-1]
        return current

    # ──── TRAVERSAL & SERIALIZATION ────

    def serialize(self) -> dict | None:
        if len(self.root.keys) == 0:
            return None
        return self.root.serialize()

    def get_all_keys(self) -> list[str]:
        result: list[str] = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node: BTreeNode, result: list[str]) -> None:
        for i in range(len(node.keys)):
            if not node.leaf and i < len(node.children):
                self._inorder(node.children[i], result)
            result.append(node.keys[i])
        if not node.leaf and len(node.children) > len(node.keys):
            self._inorder(node.children[-1], result)

    def deep_copy(self) -> BTree:
        new_tree = BTree()
        if len(self.root.keys) > 0:
            new_tree.root = copy.deepcopy(self.root)
        return new_tree
