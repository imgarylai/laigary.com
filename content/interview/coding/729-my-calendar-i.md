---
slug: "729-my-calendar-i"
section: "coding"
title: "729. My Calendar I"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[729\. My Calendar I](https://leetcode.com/problems/my-calendar-i/)

插入時間的結束時間比當前時間的開始時間小，且插入時間的開始時間比當前的結束時間小 -> 發生重疊。

```python
class MyCalendar(object):
    def __init__(self):
        self.calendar = []

    def book(self, start, end):
        for s, e in self.calendar:
            if s < end and start < e:
                return False
        self.calendar.append((start, end))
        return True


# Your MyCalendar object will be instantiated and called as such:
# obj = MyCalendar()
# param_1 = obj.book(start,end)

```