---
slug: "269-alien-dictionary"
section: "coding"
title: "269. Alien Dictionary"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972936
updated_at: 1709443537
published_at: 1674972936
---
[269\. Alien Dictionary](https://leetcode.com/problems/alien-dictionary/)

## TODO

```python
class Solution:
    def alienOrder(self, words: List[str]) -> str:

        # Step 0: create data structures + the in_degree of each unique letter to 0.
        adj_list = defaultdict(set)
        in_degree = Counter({c : 0 for word in words for c in word})

        # Step 1: We need to populate adj_list and in_degree.
        # For each pair of adjacent words...
        for i in range(1, len(words)):
            first_word = words[i-1]
            second_word = words[i]
            i = 0
            j = 0
            while i < len(first_word) and j < len(second_word):
                c1 = first_word[i]
                c2 = second_word[j]
                # 找到第一個不一樣的字元，其中 c2 一定是在 c1 後面
                if c1 != c2:
                    if c2 not in adj_list[c1]:
                        adj_list[c1].add(c2)
                        in_degree[c2] += 1
                    break
                i += 1
                j += 1
            # Check that second word isn't a prefix of first word.    
            # 如果走完 while 迴圈，遇到這樣的例子如： abc, ab，這樣的情況是不合理的，
            if j == len(second_word) and i < len(first_word):
                return ""

        # Step 2: We need to repeatedly pick off nodes with an indegree of 0.
        output = []
        queue = deque([c for c in in_degree if in_degree[c] == 0])
        while queue:
            c = queue.popleft()
            output.append(c)
            for d in adj_list[c]:
                in_degree[d] -= 1
                if in_degree[d] == 0:
                    queue.append(d)

        # If not all letters are in output, that means there was a cycle and so
        # no valid ordering. Return "" as per the problem description.
        if len(output) < len(in_degree):
            return ""
        # Otherwise, convert the ordering we found into a string and return it.
        return "".join(output)

```