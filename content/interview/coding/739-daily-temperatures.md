---
slug: "739-daily-temperatures"
section: "coding"
title: "739. Daily Temperatures"
status: "published"
pinned: false
tags: ["Monotonic", "Stack"]
created_at: 1743567353
updated_at: 1766524503
published_at: 1743567353
---
[739\. Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)

這個題目是一個單調棧 [Monotonic](/interview/coding?tag=Monotonic) 的問題。

我在兩次不同時間用了兩個不同的方向來想這個題目。

## 從過去往未來實作

其實這應該是比較直覺的想法，但是我第一次做的時候反而沒有想到這個方法，因為我卡在遍歷當下，我需要更新的答案 index 相較於當前 index 位置，都是在「過去」，所以我有點卡在要怎麼記錄過去的 index 幫助我，我到第二次的時候才想到該怎麼做。

我的 Stack 依然是紀錄過去的位置，因此在當前的位置時，我要做這些事情

1.  stack 是否為空？如果不為空，代表過去有記錄的溫度還沒有遇到更溫暖的日子
2.  我當前的氣溫是否有比過去的時間點的溫度高？如果有的話我就可以更新答案，因為這樣代表我現在的溫度已經是過去時間點，遇到的第一個比較暖的日子。

所以當這兩個條件達成的時候，我可以從 stack pop 出來過去的座標，剛好我們要更新的就是過去的座標與現在的座標的差距。

```python
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        n = len(temperatures)
        
        answer = [0] * n
        stack = []
        
        for i in range(n):
            while stack and temperatures[i] > temperatures[stack[-1]]:
                idx = stack.pop()
                answer[idx] = i - idx
            stack.append(i)
        
        return answer
```

## 從未來往過去實作

老實說我忘了我一開始為何選擇這樣做了...

但是我有當時的筆記

```python
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        
        n = len(temperatures) 
        res = [0] * n
        s = []

        for i in range(n-1, -1, -1):
            # 如果我們在棧裡面有存放 index ，我們先來看棧內存的 index 的溫度，跟當前我們比較的溫度，誰比較高，如果當前的溫度更高，我們就應該要開始退棧。因為我們是從後往前看，這樣代表的是後面的溫度沒有我現在的溫度高，我應該優先選擇現在的溫度，或是繼續退棧，直到棧內有更高的溫度就可以了。
            while s and temperatures[s[-1]] <= temperatures[i]:
                s.pop()
            # 如果棧內沒有東西，那就代表後面沒有更高溫的日期，如果棧內還有東西，現在棧內的最後一個溫度就是下一個比現在高溫的日子，透過 index 可以計算出兩天的差異。
            res[i] = 0 if not s else s[-1] - i
            s.append(i)
        
        return res
```