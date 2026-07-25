---
slug: "933-number-of-recent-calls"
section: "coding"
title: "933. Number of Recent Calls"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1709790537
updated_at: 1709790752
published_at: 1709790537
---
[933\. Number of Recent Calls](https://leetcode.com/problems/number-of-recent-calls/)

這個題目可以利用 min heap 可以保持排序的方式來檢查，只要 heap 的最小值比 t - 3000 小，代表過去的 ping 已經超過時間，可以通通 pop 出來。

要注意的點是

1.  heap 有值時才需要 pop
2.  當前的 ping 永遠都要記錄起來

最後只要查看 heap 還有幾個紀錄，就是 \[t-3000, t\] 中有幾個紀錄。

```python
class RecentCounter:

    def __init__(self):
        self.heap = []

    def ping(self, t: int) -> int:
        start = t - 3000
        while self.heap and self.heap[0] < start:
            heapq.heappop(self.heap)
        heapq.heappush(self.heap, t)
        return len(self.heap)

# Your RecentCounter object will be instantiated and called as such:
# obj = RecentCounter()
# param_1 = obj.ping(t)
```