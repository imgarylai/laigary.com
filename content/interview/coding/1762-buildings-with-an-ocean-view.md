---
slug: "1762-buildings-with-an-ocean-view"
section: "coding"
title: "1762. Buildings With an Ocean View"
status: "published"
pinned: false
tags: ["Array", "Monotonic"]
created_at: 1766521084
updated_at: 1766523048
published_at: 1766521084
---
[1762\. Buildings With an Ocean View](https://leetcode.com/problems/buildings-with-an-ocean-view/)

這個題目的設計其實滿簡單的，因為我們有一個基礎的海平面高度為零，又由於海平面在所有建築物的右邊，因此可以透過反向的遍歷來找出所有可以看到海的建築物。

```python
class Solution:
    def findBuildings(self, heights: List[int]) -> List[int]:
        max_height = 0
        res = []
        n = len(heights)
        for i in range(n - 1, -1, -1):
            if heights[i] > max_height:
                res.append(i)
            max_height = max(max_height, heights[i])
        res.reverse()
        return res
```

時間複雜度為 $O(n)$ ，空間複雜度為 $O(1)$

* * *

但是這個題目有另外一個想法，就是使用單調棧 [Monotonic](/interview/coding?tag=Monotonic) 的方式來實作，這個想法是：

1.  每次看到一個新的建築物我都加進去
2.  但是加入之前，先和已經加入的建築物去做比較。
    1.  如果目前要加入的建築物比過去加入的建築物還**「低」**，那可以直接將現在的建築物加入，因為不會擋住過去已經加入過的建築物。
    2.  如果目前要加入的建築物比過去加入的建築物還**「高」，代表這個建築物會擋住景觀，一個一個把過去的答案給 pop 出來，直到有一個建築物比現在這個建築物高為止。因為有這個過程，所以我們可以確保過去加入過的建築物，都不會被擋住景觀。**

```python
class Solution:
    def findBuildings(self, heights: List[int]) -> List[int]:
        
        res = []
        for i in range(len(heights)):
            while res and heights[i] >= heights[res[-1]]:
                res.pop()
            res.append(i)
        
        return res

```