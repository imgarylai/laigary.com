---
slug: "meta-kaitenzushi"
section: "coding"
title: "Meta - Kaitenzushi"
status: "published"
pinned: false
tags: ["Array", "Heap", "Meta"]
created_at: 1720390347
updated_at: 1720390975
published_at: 1720390347
---
```python
from typing import List
# Write any import statements here
import heapq

def getMaximumEatenDishCount(N: int, D: List[int], K: int) -> int:
  # Write your code here
  
  heap = []
  eaten = set()
  count = 0
  
  for i in range(len(D)):
    d = D[i]
    if d not in eaten:
      count += 1
      eaten.add(d)
      heapq.heappush(heap, (i, d))
      while len(heap) > K:
        out = heapq.heappop(heap)
        eaten.remove(out[1])
  
  return count

```
```python
from typing import List
# Write any import statements here
import heapq
import collections

def getMaximumEatenDishCount(N: int, D: List[int], K: int) -> int:
  # Write your code here
  
  queue = collections.deque([])
  eaten = set()
  count = 0
  
  for d in D:
    if d not in eaten:
      count += 1
      eaten.add(d)
      queue.append(d)
      while len(queue) > K:
        out = queue.popleft()
        eaten.remove(out)
  
  return count

```