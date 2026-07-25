---
slug: "710-random-pick-with-blacklist"
section: "coding"
title: "710. Random Pick with Blacklist"
status: "published"
pinned: false
tags: ["Object Oriented Design"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[710\. Random Pick with Blacklist](https://leetcode.com/problems/random-pick-with-blacklist/)

```python
class Solution:

    def __init__(self, n: int, blacklist: List[int]):
        self.table = {}
        self.size = n - len(blacklist)
        for num in blacklist:
            self.table[num] = num
        last = n - 1
        for num in blacklist:
            if num >= self.size:
                continue
            while last in self.table:
                last -= 1
            self.table[num] = last
            last -= 1

    def pick(self) -> int:
        idx = random.randint(0, self.size - 1)
        if idx in self.table:
            return self.table[idx]
        return idx


# Your Solution object will be instantiated and called as such:
# obj = Solution(n, blacklist)
# param_1 = obj.pick()

```