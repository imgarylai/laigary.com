---
slug: "642-design-search-autocomplete-system"
section: "coding"
title: "642. Design Search Autocomplete System"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1674972895
updated_at: 1674972895
published_at: 1674972895
---
[642\. Design Search Autocomplete System](https://leetcode.com/problems/design-search-autocomplete-system/)

```python
class AutocompleteSystem:

    def __init__(self, sentences: List[str], times: List[int]):
        self.trie = {}
        for sentence, time in zip(sentences, times):
            node = self.trie
            for char in sentence:
                if char not in node:
                    node[char] = {}
                node = node[char]
            node['$'] = (time, sentence)
        self.query = ''

    def save_query(self):
        node = self.trie
        for char in self.query:
            if char not in node:
                node[char] = {}
            node = node[char]
        if '$' not in node:
            node['$'] = (1, self.query)
        else:
            node['$'] = (node['$'][0] + 1, node['$'][1])

    def input(self, c: str) -> List[str]:
        if c == '#':
            self.save_query()
            self.query = ''
            return []
        else:
            self.query += c
            node = self.trie
            for char in self.query:
                if char in node:
                    node = node[char]
                else:
                    return []
            queue = deque([node])
            array = []
            while queue:
                node = queue.popleft()
                if '$' in node:
                    time, sentence = node['$']
                    array.append([-time, sentence])
                for key in node:
                    if key != '$':
                        queue.append(node[key])
            array.sort()
            res = []
            for item in array[:3]:
                res.append(item[1])
            return res

# Your AutocompleteSystem object will be instantiated and called as such:
# obj = AutocompleteSystem(sentences, times)
# param_1 = obj.input(c)

```