---
slug: "1010-pairs-of-songs-with-total-durations-divisible-by-60"
section: "coding"
title: "1010. Pairs of Songs With Total Durations Divisible by 60"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674972901
updated_at: 1674972901
published_at: 1674972901
---
[1010\. Pairs of Songs With Total Durations Divisible by 60](https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60/)

這一個題目的核心比較偏向數學，首先要先推導出以下這個關係。

$$
(a+b) \bmod 60 = 0 \\ \rightarrow ((a \bmod 60) + (b \bmod 60)) \bmod 60 =0 \\ \rightarrow \begin{equation} \begin{cases} a \bmod 60 = 0 \text{ and }  b \bmod 60 = 0 \\ a \bmod 60 + b \bmod 60 = 60 \end{cases} \end{equation}
$$

有了以上的關係式之後，我們就可以討論兩個狀況

$$
\begin{equation} \begin{cases} b \bmod 60 = 0 & \text{if } a \bmod 60 = 0\\ b \bmod 60 = 60 - a\bmod60 & \text{if } a \bmod 60 \neq 0\\\end{cases} \end{equation}
$$

這裡之後和 [1\. 2 Sum](/interview/coding/1-2-sum) 的技巧有點類似，那就是在當下的位置時，我要找之前有沒有一個數字，可以和我一起組成滿足題目條件的數值。在 2 sum 的題目裡，我要找的是和我相反的數字，讓我可以組合為 0 或是組合為某一個值，這裡的情況是：

1.  目標是我找出兩個數字對 60 求於數為零
2.  第一種情況，目前的數字對 60 求於數為零，那在我之前的「所有」的數字，只要是求於數為零的情況下，都可以組合出滿足題目條件的組合（上述推導結論一）
3.  第二種情況，目前的數字對 60 求餘數不為零，那我要找的數字就是前面是否有一個數字，對 60 求餘數時，剛好等於 60 減去我當下對 60 求餘數的值（上述推導結論二）

```python
class Solution:
    def numPairsDivisibleBy60(self, time: List[int]) -> int:
        table = defaultdict(int)
        ans = 0
        for t in time: 
            a = t % 60 
            if a == 0:
                target = 0
                ans += table[0]
            else:
                target = 60 - a
                ans += table[target]
            table[a] += 1                
        return ans

```

上述的判斷式可以更近一步精簡成下方的式子，不過可以看看就好，因為下面的簡化式不容易看出題目本身的邏輯，而且時間複雜度不變。

```python
class Solution:
    def numPairsDivisibleBy60(self, time: List[int]) -> int:
        table = defaultdict(int)
        ans = 0
        for t in time: 
            target = (60 - t % 60) % 60
            ans += table[target]
            table[t % 60] += 1
        return ans

```