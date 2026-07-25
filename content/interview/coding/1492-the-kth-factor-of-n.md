---
slug: "1492-the-kth-factor-of-n"
section: "coding"
title: "1492. The kth Factor of n"
status: "published"
pinned: false
tags: ["Math"]
created_at: 1674972898
updated_at: 1674972898
published_at: 1674972898
---
[1492\. The kth Factor of n](https://leetcode.com/problems/the-kth-factor-of-n/)

這一個題目可以直接用暴力法來解，搜尋空間為 `1` 到 `n/2 + 1`，時間複雜度為 $O(n/2) \approx O(n)$ 。

```python
class Solution:
    def kthFactor(self, n: int, k: int) -> int:
        for i in range(1, n//2+1):
            if n % i == 0:
                k -= 1
                if k == 0:
                    return i
        return n if k == 1 else -1

```

不過既然是第 k 個項目，多數只要是找第 k 個項目的題目，都可以試著用 heap 來想。

```python
class Solution:
    def kthFactor(self, n: int, k: int) -> int:
        heap = []
        for x in range(1, int(n**0.5) + 1):
            if n % x == 0:
                heappush(heap, - x)
                if len(heap) > k:
                    heappop(heap)
                if x != n // x:
                    heappush(heap, - n // x)
                    if len(heap) > k:
                        heappop(heap)

        return -heappop(heap) if k == len(heap) else -1

```