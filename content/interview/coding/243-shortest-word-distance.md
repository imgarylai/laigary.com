---
slug: "243-shortest-word-distance"
section: "coding"
title: "243. Shortest Word Distance"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1761433325
updated_at: 1761461794
published_at: 1761433325
---
[243\. Shortest Word Distance](https://leetcode.com/problems/shortest-word-distance/)

這是一個非常適合面試的題目，暴力法求解的方式也很簡單如下：

```python
class Solution:
    def shortestDistance(self, wordsDict: List[str], word1: str, word2: str) -> int:
        table = defaultdict(list)

        for i in range(len(wordsDict)):
            table[wordsDict[i]].append(i)

        
        w1 = table[word1]
        w2 = table[word2]

        res = float('inf')

        for i in w1:
            for j in w2:
                res = min(res, abs(i - j))
        
        return res
```

​時間複雜度的部分，LeetCode 是寫 $O(n^2)$ ，但我覺得不能單純的寫是 $O(n^2)$ 因爲 `wordsDict` 一定要至少要有 `word1` 跟 `word2` ，我覺得更好的時間複雜度寫法應該還是要寫 $O(n \times m)$ ，`n` 代表 `word1` 的出現次數， `m` 代表 `word2` 的出現次數，因為 `wordsDict` 的總長度還是靠 `n + m` 來組成的。單純寫 $O(n^2)$ 還是差了一點點。

會有這個時間複雜度的分析，也是跟這個題目有個更優解存在，那就是我們在遍歷 `wordsDict` 時，同時更新每次更新紀錄 `word1` 與 `word2` 的索引。

這個方法可行的原因是這樣的，假設我們現在紀錄了一次 `word1` 的位置，`word2` 可以更新的地方有兩個

1.  之前就看過 `word2` ，那現在才看到一次 `word1` 那至少我們知道這兩次的距離是這兩個字最近的一次距離，因為在更早出現的 `word2` 已經被更新過了，我們雖然不能保證這是最近的距離，但是可以得知這是多個最近的距離的其中一個。
2.  之前還沒有看到 `word2` ，現在第一次看到，那我們知道現在的距離就是 `word1` 與 `word2` 最近的一個距離。之後再更新的所有的 `word2` 都只會更遠。

以此類推，當 `word2` 固定時， `word1` 也可以用此方法來更新。

```python
class Solution:
    def shortestDistance(self, wordsDict: List[str], word1: str, word2: str) -> int:
        
        i1 = -1
        i2 = -1
        res = float('inf')

        for i in range(len(wordsDict)):
            curr = wordsDict[i]
            if word1 == curr:
                i1 = i
            elif word2 == curr:
                i2 = i
            
            if i1 != -1 and i2 != -1:
                res = min(res, abs(i1 - i2))
            
        
        return res
```

此時，時間複雜度為 $O(n + m)$ 空間複雜度為 $O(1)$ 。

當知道了這個做法後，可以進一步優化，因為我們每次只在乎 `word1` 跟 `word2` 而已，可以進一步優化成只要知道這兩個字所有位置出現的相對位置，就能用同樣的邏輯找出最小距離。

```python
class Solution:
    def shortestDistance(self, wordsDict: List[str], word1: str, word2: str) -> int:
        locations = defaultdict(list)

        for i, word in enumerate(wordsDict):
            locations[word].append(i)
        
        loc1 = locations[word1]
        loc2 = locations[word2]

        i1 = 0
        i2 = 0
        res = float('inf')

        while i1 < len(loc1) and i2 < len(loc2):
            res = min(res, abs(loc1[i1] - loc2[i2]))
            if loc1[i1] < loc2[i2]:
                i1 += 1
            else:
                i2 += 1
        
        return res
```

這一步是真的很難想到，但是如果可以想到這一步，基本上就可以完成 [244\. Shortest Word Distance II](/interview/coding/244-shortest-word-distance-ii) 。