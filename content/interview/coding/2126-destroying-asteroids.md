---
slug: "2126-destroying-asteroids"
section: "coding"
title: "2126. Destroying Asteroids"
status: "published"
pinned: false
tags: ["Greedy"]
created_at: 1743570470
updated_at: 1743570729
published_at: 1743570470
---
[2126\. Destroying Asteroids](https://leetcode.com/problems/destroying-asteroids/)

```python
class Solution:
    def asteroidsDestroyed(self, mass: int, asteroids: List[int]) -> bool:
        asteroids.sort()

        for asteroid in asteroids:
            if mass >= asteroid:
                mass += asteroid
            else:
                return False
        return True

```