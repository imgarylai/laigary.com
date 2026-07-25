---
slug: "2187-minimum-time-to-complete-trips"
section: "coding"
title: "2187. Minimum Time to Complete Trips"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1762205154
updated_at: 1762205172
published_at: 1762205154
---
[2187\. Minimum Time to Complete Trips](https://leetcode.com/problems/minimum-time-to-complete-trips/)

```python
class Solution:
    def minimumTime(self, time: List[int], totalTrips: int) -> int:
        left, right = 1, max(time) * totalTrips

        def getTrips(given_time):
            actual_trips = 0
            for t in time:
                actual_trips += given_time // t
            return actual_trips

        while left <= right:
            mid = (left + right) // 2
            if getTrips(mid) >= totalTrips:
                right = mid - 1
            else:
                left = mid + 1
        return left
```