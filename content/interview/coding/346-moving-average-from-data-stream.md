---
slug: "346-moving-average-from-data-stream"
section: "coding"
title: "346. Moving Average from Data Stream"
status: "published"
pinned: false
tags: ["Queue"]
created_at: 1743564996
updated_at: 1743565019
published_at: 1743564996
---
[346\. Moving Average from Data Stream](https://leetcode.com/problems/moving-average-from-data-stream/)

```python
class MovingAverage:

    def __init__(self, size: int):
        self.size = size
        self.memo = deque([])
        self.avg = 0
        

    def next(self, val: int) -> float:
        if len(self.memo) >= self.size:
            self.avg = (self.avg * len(self.memo) - self.memo[0] + val)/len(self.memo)
            self.memo.popleft()
        else:
            self.avg = (self.avg * len(self.memo) + val)/(len(self.memo) + 1)
        self.memo.append(val)
        return self.avg
        
        


# Your MovingAverage object will be instantiated and called as such:
# obj = MovingAverage(size)
# param_1 = obj.next(val)
```