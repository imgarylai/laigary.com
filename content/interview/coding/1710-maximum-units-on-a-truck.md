---
slug: "1710-maximum-units-on-a-truck"
section: "coding"
title: "1710. Maximum Units on a Truck"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674841961
updated_at: 1674842052
published_at: 1674841961
---
[1710\. Maximum Units on a Truck](https://leetcode.com/problems/maximum-units-on-a-truck/)

這個題目的情境像是，我們有一座倉庫有不同的貨物分裝在不同但是統一大小的箱子內，每個箱子大小一致，但是箱子內的商品數量（numberOfUnitsPerBox）不一樣，每個箱子的庫存數量（numberOfBoxes）也不同。我們要把商品搬到貨車上，貨車上的空間有限，總共可以儲存 N 個箱子（truckSize）。

此題目要求我們要盡可能地在貨車上滿載最多的商品（numberOfUnitsPerBox）。

要解決這個問題，我們在選擇的時候有幾個條件：

如果我們只剩下一個空位，那一定是選擇每箱有最多商品的選項，或是換個角度想如果箱子數量遠大於車子可以裝卸的數量，我們直接把該貨物裝滿車子

每次能放進去車子的數量取決於

1.  車子內還剩下多少空間（remaining）
2.  倉庫內還有多少庫存（numberOfBoxes）
3.  為了要完成第一個條件，我們要盡可能地先去查看擁有最多商品數量（numberOfUnitsPerBox）的箱子 L3。一開始將 boxTypes 透過 numberOfUnitsPerBox 來降冪排序。
4.  第二個條件，可以用兩個方法追蹤：用了多少空間、還剩下多少空間。

```python
class Solution:
    def maximumUnits(self, boxTypes: List[List[int]], truckSize: int) -> int:
        boxTypes.sort(key=lambda x: -x[1])
        remaining = truckSize
        ans = 0
        for numberOfBoxes, numberOfUnitsPerBox in boxTypes:
            if remaining == 0: break
            availableBoxes = min(numberOfBoxes, remaining)
            ans += availableBoxes * numberOfUnitsPerBox
            remaining -= availableBoxes
        return ans
```
```python
class Solution:
    def maximumUnits(self, boxTypes: List[List[int]], truckSize: int) -> int:
        boxTypes.sort(key=lambda x: -x[1])
        space_used = 0
        ans = 0
        for numberOfBoxes, numberOfUnitsPerBox in boxTypes:
            if space_used >= truckSize: break
            availableBoxes = min(numberOfBoxes, truckSize - space_used)
            ans += availableBoxes * numberOfUnitsPerBox
            space_used += availableBoxes
        return ans
```