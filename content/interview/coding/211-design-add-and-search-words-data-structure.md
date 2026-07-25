---
slug: "211-design-add-and-search-words-data-structure"
section: "coding"
title: "211. Design Add and Search Words Data Structure"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1674972895
updated_at: 1674972895
published_at: 1674972895
---
[211\. Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/)

這一題比較特別，需要模糊比對搜尋的字串，主要也要用到 Trie 除了紀錄自以爲，可以用特殊的字元記錄額外資訊

```python
class WordDictionary:

    def __init__(self):
        """
        Initialize your data structure here.
        """
        self.trie = {}

    def addWord(self, word: str) -> None:
        node = self.trie
        for char in word:
            if char not in node:
                node[char] = {}
            node = node[char]
        node['$'] = True


    def search(self, word: str) -> bool:
        def search_in_node(word, node) -> bool:
            for i, char in enumerate(word):
                if char == '.':
                    for x in node:
                        if x != '$' and search_in_node(word[i+1:], node[x]):
                            return True
                if char not in node:
                    return False
                else:
                    node = node[char]
            return '$' in node
        return search_in_node(word, self.trie)


# Your WordDictionary object will be instantiated and called as such:
# obj = WordDictionary()
# obj.addWord(word)
# param_2 = obj.search(word)

```