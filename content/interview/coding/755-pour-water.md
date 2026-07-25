---
slug: "755-pour-water"
section: "coding"
title: "755. Pour Water"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1703833018
published_at: 1674973112
---
[755\. Pour Water](https://leetcode.com/problems/pour-water/)

```python
class Solution:
    def pourWater(self, heights: List[int], volume: int, k: int) -> List[int]:
        

        while volume > 0:
            curr = k

            while curr > 0 and heights[curr] >= heights[curr - 1]:
                curr -= 1
            
            while curr < len(heights) - 1 and heights[curr] >= heights[curr + 1]:
                curr += 1
            
            while curr > k and heights[curr] >= heights[curr - 1]:
                curr -= 1

            heights[curr] += 1

            volume -= 1

        
        return heights
```
```python
class Solution:
    def pourWater(self, heights: List[int], volume: int, k: int) -> List[int]:
        for _ in range(volume):

            # start pouring left
            left = k
            for i in range(k - 1, -1, -1):
                # hit left wall, stop
                if heights[i] > heights[i + 1]:
                    break
                # droplet go to lower place
                elif heights[i] < heights[i + 1]:
                    left = i
                # droplet stay 
                else:
                    continue
            # if left != k mean droplet goes to left, stop this iteration
            if left != k:
                heights[left] += 1
                continue

            # otherwise, droplet start pouring right
            right = k
            for i in range(k + 1, len(heights)):
                # hit right, wall
                if heights[i] > heights[i - 1]:
                    break
                # droplet go to lower place
                elif heights[i] < heights[i - 1]:
                    right = i
                # droplet stay     
                else:
                    continue
            if right != k:
                heights[right] += 1
            else:
                heights[k] += 1
        return heights

```

-   [42. Trapping Rain Water](/interview/coding/42-trapping-rain-water)
-   [11. Container With Most Water](/interview/coding/11-container-with-most-water)