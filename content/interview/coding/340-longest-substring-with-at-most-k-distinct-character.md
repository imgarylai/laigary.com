---
slug: "340-longest-substring-with-at-most-k-distinct-character"
section: "coding"
title: "340. Longest Substring with At Most K Distinct Character"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1674972901
updated_at: 1709962306
published_at: 1674972901
---
[340\. Longest Substring with At Most K Distinct Character](https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/)

[159\. Longest Substring with At Most Two Distinct Characters](/interview/coding/159-longest-substring-with-at-most-two-distinct-characters) 的泛化版。

```python
class Solution:
    def lengthOfLongestSubstringKDistinct(self, s: str, k: int) -> int:
        fast = 0
        slow = 0
        memo = defaultdict(int)
        res = 0
        while fast < len(s):
            char = s[fast]
            fast += 1

            memo[char] += 1

            while len(memo) > k:
                d = s[slow]
                slow += 1
                memo[d] -= 1
                if memo[d] == 0:
                    del memo[d]
            res = max(res, fast - slow)
        return res

```