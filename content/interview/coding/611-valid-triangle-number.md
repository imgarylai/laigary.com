---
slug: "611-valid-triangle-number"
section: "coding"
title: "611. Valid Triangle Number"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1784321793
updated_at: 1784324680
published_at: 1784321792
---
[611. Valid Triangle Number](https://leetcode.com/problems/valid-triangle-number/)

這個題目的問題是，給定一個陣列，找出所有可以滿足三角形定義的組合，這個陣列可以是

1. 本身無序
2. 數字可以重複
3. 數量從 1 到 1000 且數字從 0 到 1000

三角形的定義並不難，那就是任意兩邊和一定要大於第三邊長度。

1. a + b &gt; c
2. a + c &gt; b
3. b + c &gt; a

如果我們窮舉，其實也可以把答案找到，時間複雜度為 $O(n^3)$

這題在面試中，比較困難的不是在寫出解答，是需要去稍微推導一個關係去幫助我們在這個題目的條件下，更有效地找出所有的組合。

我自己的想法是，如果題目是無序的，我會想要先讓他有序看看，看看會不會幫助我們解題。因為在窮舉的時間複雜度已經是 $O(n^3)$ ，就算我多一步排序讓時間複雜度將一維，還是比原本的有效率。

當我排序完後，就比較方便去做這個推導：

就是在 a, b, c 如果這三個數字是遞增的時候，如果我可以找到 a + b &gt; c ，那我就一定可以知道 a + c &gt; b 跟 b + c &gt; a 一定是成立的。

1. **a + c** &gt; a + b &gt; c &gt; **b**
2. **b + c** &gt; a + b &gt; c &gt; **a**

而且我就可以知道，如果我今天有兩個數字 a, b 可以跟 c 組合成三角形，那 a 到 b - 1 之間的數字 a’，都一定可以跟 b, c 成為三角形。因為 a’ + b &gt; c 且 a’, b, c 還是保持遞增的。

所以整個邏輯要做的事情就是

1. 先排序
2. 要先定錨最大的數字 c ，從排序過的陣列的最後依序往前出發
3. c 前面會有一個數列，我們要找出 a and b
   1. a, b 要滿足 a + b &gt; c 且 a &lt;= b&lt;= c (但是我們已經排序過了，第二個會自動滿足）
   2. 當找到 a, b 後，可以知道組成 b - a + 1 個三角形

```python
class Solution:
    def triangleNumber(self, nums: List[int]) -> int:
        nums.sort()
        
        res = 0
        i = len(nums) - 1

        while i >= 2:
            c = nums[i]
            left = 0
            right = i - 1 
            while left < right:
                a = nums[left]
                b = nums[right]
                if a + b > c:
                    res += (right - left)
                    right -= 1
                else:
                    left += 1
            i -= 1

        return res
        
```