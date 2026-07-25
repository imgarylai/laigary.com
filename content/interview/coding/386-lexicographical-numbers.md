---
slug: "386-lexicographical-numbers"
section: "coding"
title: "386. Lexicographical Numbers"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972900
updated_at: 1709446293
published_at: 1674972900
---
[386\. Lexicographical Numbers](https://leetcode.com/problems/lexicographical-numbers/)

```python
class Solution:
    def lexicalOrder(self, n: int) -> List[int]:
        strArr = [str(i) for i in range(1,n+1)]
        strArr.sort()
        return [int(s) for s in strArr]

```