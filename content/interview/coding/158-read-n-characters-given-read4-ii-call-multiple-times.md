---
slug: "158-read-n-characters-given-read4-ii-call-multiple-times"
section: "coding"
title: "158. Read N Characters Given Read4 II - Call multiple times"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972901
updated_at: 1674972901
published_at: 1674972901
---
[158\. Read N Characters Given Read4 II - Call multiple times](https://leetcode.com/problems/read-n-characters-given-read4-ii-call-multiple-times/)

```python
# The read4 API is already defined for you.
# def read4(buf4: List[str]) -> int:

class Solution:
    def __init__(self):
        self.queue = collections.deque()

    def read(self, buf, n):
        i = 0
        while i < n:
            buf4 = [''] * 4 
            _ = read4(buf4) 
            self.queue.extend(buf4)
            count = min(len(self.queue), n - i) 
            if not count:
                break
            buf[i:] = [self.queue.popleft() for _ in range(count)]
            i += count
        return i

```