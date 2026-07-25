---
slug: "monotonic-stack-template"
section: "coding"
title: "單調棧模板"
status: "published"
pinned: false
tags: ["Monotonic", "Stack"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
看到「下一個更大 / 前一個更小 / 能延伸多遠」就想單調棧。它的作用是：**每個元素進出棧各一次，把 $O(n^2)$ 的比較降到 $O(n)$**。

```python
def next_greater(nums):
    stack = []                       # 存索引，不存值（常常需要距離）
    res = [-1] * len(nums)
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:   # 破壞單調性 → 彈出並結算
            idx = stack.pop()
            res[idx] = x             # x 就是 idx 的「下一個更大元素」
        stack.append(i)
    return res
```

三個決定要先想清楚：

1. **棧裡存什麼** — 存索引，因為值可以用 `nums[i]` 查回來，索引查不回去
2. **維持遞增還是遞減** — 找「更大」用遞增棧（遇到更大就彈），找「更小」用遞減棧
3. **彈出的時候要算什麼** — 被彈出的元素在此刻才知道自己的答案，結算就寫在 `pop` 後面

例題：[496. Next Greater Element I](/interview/coding/496-next-greater-element-i)、[739. Daily Temperatures](/interview/coding/739-daily-temperatures)

## 「往左右各能延伸多遠」型

柱狀圖類的題目要同時知道左右邊界。技巧是：**被彈出時，當前的 `i` 就是右邊界，棧中新的頂端就是左邊界** — 一次遍歷同時拿到兩邊：

```python
stack = []
for i in range(len(heights) + 1):
    h = heights[i] if i < len(heights) else 0    # 補一個 0 收尾，清空棧
    while stack and heights[stack[-1]] >= h:
        height = heights[stack.pop()]
        left = stack[-1] if stack else -1        # 新棧頂就是左邊界
        ans = max(ans, height * (i - left - 1))
    stack.append(i)
```

結尾補一個 `0`（哨兵）比迴圈外再寫一段清空邏輯乾淨很多。

例題：[84. Largest Rectangle in Histogram](/interview/coding/84-largest-rectangle-in-histogram)

## 接雨水：橫著看

Trapping Rain Water 用單調遞減棧，彈出的那個是「凹槽底」，左右兩根柱子夾出一層水：

```python
    while stack and height[i] > height[stack[-1]]:
        bottom = stack.pop()
        if not stack:
            break                    # 左邊沒牆，接不住
        width = i - stack[-1] - 1
        depth = min(height[i], height[stack[-1]]) - height[bottom]
        water += width * depth
```

這題也能用對撞的雙指針做（見 [Two Pointers 模板](/interview/coding/two-pointers-template)），面試時能講出兩種做法很加分。

例題：[42. Trapping Rain Water](/interview/coding/42-trapping-rain-water)

## 普通棧 vs 單調棧

不是所有 stack 題都是單調棧。**成對匹配、運算式求值、巢狀結構**用的是普通棧 — 進出的規則是語法決定的，不是大小決定的：

例題：[20. Valid Parentheses](/interview/coding/20-valid-parentheses)、[394. Decode String](/interview/coding/394-decode-string)、[224. Basic Calculator](/interview/coding/224-basic-calculator)、[155. Min Stack](/interview/coding/155-min-stack)

## 面試時的講法

先講「我要維護一個遞減棧，因為我要找每個元素右邊第一個比它大的」— 把單調方向和它對應的問題連起來。再強調每個元素最多進棧一次、出棧一次，所以雖然有巢狀迴圈但總複雜度是 $O(n)$，這是面試官最想聽到的一句。

更多題目 → [#Monotonic](/interview/coding?tag=Monotonic)
