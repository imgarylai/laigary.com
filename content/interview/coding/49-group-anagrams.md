---
slug: "49-group-anagrams"
section: "coding"
title: "49. Group Anagrams"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674972899
updated_at: 1743821850
published_at: 1674972899
---
[49\. Group Anagrams](https://leetcode.com/problems/group-anagrams/)

Anagram 的特性就是裡面的每個字元出現的頻率相同，如果經過排序的話，只要是 Anagram 就一定會一樣。

利用這個特性，我們將每個詞都排序過，當作 key ，在 Hash table 裡面去把每個 anagram 加到那個 arrary 裡面。

```python
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        table = defaultdict(list)
        for s in strs:
            table[tuple(sorted(s))].append(s)
        return list(table.values())

```