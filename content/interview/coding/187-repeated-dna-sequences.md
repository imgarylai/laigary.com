---
slug: "187-repeated-dna-sequences"
section: "coding"
title: "187. Repeated DNA Sequences"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[187\. Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/)

1.  使用 Hash Table 的特性來判斷是否有重複出現的 sequence
2.  滑動窗口的方式來找

```python
class Solution:
    def findRepeatedDnaSequences(self, s: str) -> List[str]:
        table = defaultdict(int)
        for i in range(len(s) - 9):
            table[s[i:i+10]] += 1
        ans = []
        for key, val in table.items():
            if val >= 2:
                ans.append(key)
        return ans

```