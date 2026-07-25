---
slug: "244-shortest-word-distance-ii"
section: "coding"
title: "244. Shortest Word Distance II"
status: "published"
pinned: false
tags: ["Hash Table", "Two Pointers"]
created_at: 1761461514
updated_at: 1761461808
published_at: 1761461514
---
[244\. Shortest Word Distance II](https://leetcode.com/problems/shortest-word-distance-ii/)

參考： [243\. Shortest Word Distance](/interview/coding/243-shortest-word-distance)

```python
class WordDistance:

    def __init__(self, wordsDict: List[str]):
        self.locations = defaultdict(list)

        for i, word in enumerate(wordsDict):
            self.locations[word].append(i)

        

    def shortest(self, word1: str, word2: str) -> int:
        i1 = 0
        i2 = 0
        loc1 = self.locations[word1]
        loc2 = self.locations[word2]
        res = float('inf')

        while i1 < len(loc1) and i2 < len(loc2):
            res = min(res, abs(loc1[i1] - loc2[i2]))
            if loc1[i1] < loc2[i2]:
                i1 += 1
            else:
                i2 += 1
        
        
        return res
        


# Your WordDistance object will be instantiated and called as such:
# obj = WordDistance(wordsDict)
# param_1 = obj.shortest(word1,word2)
```