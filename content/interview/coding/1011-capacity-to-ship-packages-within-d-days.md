---
slug: "1011-capacity-to-ship-packages-within-d-days"
section: "coding"
title: "1011. Capacity To Ship Packages Within D Days"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674944233
updated_at: 1784934714
published_at: 1674944233
---
[1011. Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

**題目**：`weights` 是包裹重量，**必須依序**寄送，要在 `days` 天內運完，求貨櫃的最小容量。

**為什麼不是 DP**：順序固定，切分點之間沒有可重用的子問題，寫不出轉移方程。

**改用二分答案**。搜尋空間 `[max(weights), sum(weights)]`：

- 下界 `max(weights)`：容量比最重的包裹小 → 那個包裹永遠裝不進去。
- 上界 `sum(weights)`：一天全部運完，再大也沒意義。

**check(cap)**：貪心，依序裝，裝不下就換新的一天。

```py
def need_days(cap):
    days, cur = 1, 0
    for w in weights:
        if cur + w > cap:
            days += 1
            cur = 0
        cur += w
    return days
```

**單調性**：cap 越大 → 天數越少。

- `need_days(cap) > days` → 太小 → `left = cap + 1`
- 否則可行 → `right = cap - 1`（往更小試）

回傳 `left` = 第一個可行的容量。

```python
class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        
        def need_days(cap):
            days, cur = 1, 0
            for w in weights:
                if cur + w > cap:
                    days += 1
                    cur = 0
                cur += w
            return days

        left = max(weights)
        right = sum(weights)

        while left <= right:
            mid = left + (right - left) // 2
            if need_days(mid) > days:
                left = mid + 1
            else:
                right = mid - 1
        
        return left
```

