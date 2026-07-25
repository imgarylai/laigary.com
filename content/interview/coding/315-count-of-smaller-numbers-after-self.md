---
slug: "315-count-of-smaller-numbers-after-self"
section: "coding"
title: "315. Count of Smaller Numbers After Self"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[315\. Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)

```python
class BinaryIndexedTree:
    def __init__(self, n: int):
        self.sums = [0] * (n + 1)

    def lowbit(self, x):
        return x & -x

    def update(self, i):
        while i < len(self.sums):
            self.sums[i] += 1
            i += self.lowbit(i)

    def query(self, i):
        r = 0
        while i > 0:
            r += self.sums[i]
            i -= self.lowbit(i)
        return r

class Solution:
    def countSmaller(self, nums: List[int]) -> List[int]:
        sorted_nums = sorted(set(nums))
        hashTable = {val: idx for idx, val in enumerate(sorted_nums)}

        tree = BinaryIndexedTree(len(hashTable))
        res = []
        for i in reversed(range(len(nums))):
            # hashTable[1] => 0
            # hashTable[6] => 3
            # hashTable[2] => 1
            # hashTable[5] => 2
            key = hashTable[nums[i]]
            searchResult = tree.query(key)
            res.append(searchResult)
            tree.update(hashTable[nums[i]] + 1)
        return res[::-1]

```