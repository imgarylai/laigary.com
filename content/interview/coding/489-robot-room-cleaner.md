---
slug: "489-robot-room-cleaner"
section: "coding"
title: "489. Robot Room Cleaner"
status: "published"
pinned: false
tags: []
created_at: 1674845061
updated_at: 1674845077
published_at: 1674845061
---
[489\. Robot Room Cleaner](https://leetcode.com/problems/robot-room-cleaner/)

```python
# """
# This is the robot's control interface.
# You should not implement it, or speculate about its implementation
# """
#class Robot:
#    def move(self):
#        """
#        Returns true if the cell in front is open and robot moves into the cell.
#        Returns false if the cell in front is blocked and robot stays in the current cell.
#        :rtype bool
#        """
#
#    def turnLeft(self):
#        """
#        Robot will stay in the same cell after calling turnLeft/turnRight.
#        Each turn will be 90 degrees.
#        :rtype void
#        """
#
#    def turnRight(self):
#        """
#        Robot will stay in the same cell after calling turnLeft/turnRight.
#        Each turn will be 90 degrees.
#        :rtype void
#        """
#
#    def clean(self):
#        """
#        Clean the current cell.
#        :rtype void
#        """

class Solution:
    def cleanRoom(self, robot):
        """
        :type robot: Robot
        :rtype: None
        """

        def back():
            robot.turnRight()
            robot.turnRight()
            robot.move()
            robot.turnRight()
            robot.turnRight()

        def backtrack(cell, d):
            visited.add(cell)
            robot.clean()
            for i in range(4):
                di = (i + d) % 4
                new_cell = (cell[0] + directions[di][0], cell[1] + directions[di][1])
                if new_cell not in visited and robot.move():
                    backtrack(new_cell, di)
                    back()
                robot.turnRight()

        directions = [(1,0),(0,1),(-1,0),(0,-1)]
        visited = set()
        backtrack((0, 0), 0)
```