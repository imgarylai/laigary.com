---
slug: "2244-minimum-rounds-to-complete-all-tasks"
section: "coding"
title: "2244. Minimum Rounds to Complete All Tasks"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1761436658
updated_at: 1761449905
published_at: 1761436658
---
[2244\. Minimum Rounds to Complete All Tasks](https://leetcode.com/problems/minimum-rounds-to-complete-all-tasks/)

這一題可以算是經典的 [Dynamic Programming](/interview/coding?tag=Dynamic%20Programming) [70\. Climbing Stairs](/interview/coding/70-climbing-stairs) 的變形。只是題目從一次可以走一階兩階，變成了一次可以走兩階或三階，但是要考慮無法走完的情況。

```python
class Solution:
    def minimumRounds(self, tasks: List[int]) -> int:
        
        counter = Counter(tasks)

        @cache
        def dp(jobs):
            if jobs == 0:
                return 0
            if jobs == 1:
                return -1
            if jobs == 2 or jobs == 3:
                return 1
            
            two = dp(jobs - 2)
            three = dp(jobs - 3)
            if two == -1 and three == -1:
                return -1
            elif two == -1:
                return 1 + three
            elif three == -1:
                return 1 + two
            else:
                return 1 + min(two, three)

        count = 0
        for values in counter.values():
            curr = dp(values)
            if curr == -1:
                return -1
            count += curr

        return count
```

時間複雜度的分析比較複雜一點 。

1.  我們需要 $O(n)$ 的時間複雜度去計算出 tasks 的計數
2.  遞迴的部分，我們有使用了記憶體優化的方法，所以總共會計算 $ O(M) $ 次，$M = max(counter.values())$，因為我們只會計算出 0 至 M 的 dp 一次。
3.  最後是我們會對每一個任務呼叫一次 dp ，總共會計算 $O(k)$ 次，$k = len(counter.values())$。

最後的時間複雜度是 $O(n + M + k) ~= O(n) $ 空間複雜度也是 $O(n)$。