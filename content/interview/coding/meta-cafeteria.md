---
slug: "meta-cafeteria"
section: "coding"
title: "Meta - Cafeteria"
status: "published"
pinned: false
tags: ["Array", "Meta"]
created_at: 1720328325
updated_at: 1720328560
published_at: 1720328325
---
題目問的是餐廳有 N 個位置，但是我們需要保持 k 個單位的社交距離，座位上目前會有 M 個人在位置上，其座位表由 S 陣列中的數字表達哪些位置被坐走了，想問最多還可以有幾個人入座？

```python
from typing import List
# Write any import statements here

def getMaxAdditionalDinersCount(N: int, K: int, M: int, S: List[int]) -> int:
  # Write your code here
  seats = 0
  S.sort()
  left = 1
  for s in S:
    right = s - (K + 1)
    seats += 1 + (right - left) // (K + 1)
    left = s + K + 1
  seats += 1 + (N - left) // (K + 1)
  
  return seats

```