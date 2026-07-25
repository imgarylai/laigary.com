---
slug: "989-add-to-array-form-of-integer"
section: "coding"
title: "989. Add to Array-Form of Integer"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[989\. Add to Array-Form of Integer](https://leetcode.com/problems/add-to-array-form-of-integer/)

```python
class Solution:
    def addToArrayForm(self, num: List[int], k: int) -> List[int]:
        num[-1] += k
        for i in reversed(range(len(num))):
            carry = num[i] // 10
            num[i] = num[i] % 10
            if i: 
                num[i-1] += carry
        while carry:
            num = [carry%10] + num
            carry = carry // 10
        return num

```