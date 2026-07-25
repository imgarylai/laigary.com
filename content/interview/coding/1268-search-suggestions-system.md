---
slug: "1268-search-suggestions-system"
section: "coding"
title: "1268. Search Suggestions System"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1674972895
updated_at: 1674972895
published_at: 1674972895
---
[1268\. Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/)

```python
class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode)
        self.words = list()

class Trie:
    def __init__(self):
        self.root = TrieNode()
        self.node = self.root

    def add_word(self, word):
        node = self.root
        for c in word:
            node = node.children[c] 
            if len(node.words) < 3:
                node.words.append(word)

    def find_word_by_prefix(self, c):
        if self.node and c in self.node.children: 
            self.node = self.node.children[c] 
            return self.node.words
        else: 
            self.node = None    
            return []

class Solution:
    def suggestedProducts(self, A: List[str], searchWord: str) -> List[List[str]]:
        A.sort()
        trie = Trie()
        for word in A: trie.add_word(word)
        return [trie.find_word_by_prefix(c) for c in searchWord]

```
```python
class Solution:
    def suggestedProducts(self, products: List[str], searchWord: str) -> List[List[str]]:
        ans = []
        products.sort()
        for i, c in enumerate(searchWord):
            products = [ product for product in products if len(product) > i and product[i] == c ]
            ans.append(products[:3])
        return ans

```