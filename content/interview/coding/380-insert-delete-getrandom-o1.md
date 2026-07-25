---
slug: "380-insert-delete-getrandom-o1"
section: "coding"
title: "380. Insert Delete GetRandom O(1)"
status: "published"
pinned: false
tags: ["Object Oriented Design"]
created_at: 1674972900
updated_at: 1709523614
published_at: 1674972900
---
[380\. Insert Delete GetRandom $O(1)$](https://leetcode.com/problems/insert-delete-getrandom-o1/)

```python
class RandomizedSet:

    def __init__(self):
        """
        Initialize your data structure here.
        """
        self.table = {} # val to index
        self.arr = []


    def insert(self, val: int) -> bool:
        """
        Inserts a value to the set. Returns true if the set did not already contain the specified element.
        """
        if val in self.table:
            return False
        self.table[val] = len(self.arr)
        self.arr.append(val)
        return True


    def remove(self, val: int) -> bool:
        """
        Removes a value from the set. Returns true if the set contained the specified element.
        """
        if val not in self.table:
            return False
        idx = self.table[val]
        self.table[self.arr[-1]] = idx
        self.arr[idx], self.arr[-1] = self.arr[-1], self.arr[idx]
        self.arr.pop()
        del self.table[val]
        return True


    def getRandom(self) -> int:
        """
        Get a random element from the set.
        """
        return self.arr[random.randint(0, len(self.arr)-1)]



# Your RandomizedSet object will be instantiated and called as such:
# obj = RandomizedSet()
# param_1 = obj.insert(val)
# param_2 = obj.remove(val)
# param_3 = obj.getRandom()

```