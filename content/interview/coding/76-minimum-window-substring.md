---
slug: "76-minimum-window-substring"
section: "coding"
title: "76. Minimum Window Substring"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1722485173
published_at: 1674972894
---
[76\. Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/)

滑動窗口的經典題目，題目要求要找到最短的子字串，裡面包含了 `t` 字串有的字元。

1.  我們需要想的是窗口增大的時候，需要更新哪些資訊？

-   我們需要看看該字元有沒有出現在目標裡面，如果有的話，**增加計數**
-   如果我們已經取得了足夠的字元，我們就要去更新 `valid` ，這個數字是看每個字元的數量是不是都足夠了。

1.  何時要收縮窗口？
    1.  當 valid 和目標的 key 的數量一至的時候，代表我們已經湊足了所有的字元，接下來我們要去檢查看看是不是有多的資訊可以被刪掉，例如：有些字元可能是需要的，但是早就收集超過需要的數量了。
2.  收縮窗口時，需要更新哪些資訊？
    1.  此時這個**窗口的大小有沒有比之前的窗口還要小**？有的話我們就要更新
    2.  新的最小窗口字串的起始點
    3.  新的最小窗口的長度
    4.  接著縮小窗口，如果說此時某字元在 memo 中的計數和目標中相同了，我們要減少 valid 的數量（也會順便結束 while）
    5.  並且把字元的**計數減一**
3.  最終結果要在「擴大窗口」時更新還是「收縮窗口」時更新？
4.  此題在「收縮」時更新

滑動窗口還會有一個特點，增大窗口跟減少窗口的行為一般來說都是相反的。

```python
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        target = Counter(list(t))
        memo = defaultdict(int)
        left = 0
        right = 0
        valid = 0
        start = 0
        L = float('inf')

        
        while right < len(s):
            char = s[right]
            right += 1
            
            if char in target:
                memo[char] += 1
                if memo[char] == target[char]:
                    valid += 1

            while valid == len(target):
                if right - left < L:
                    start = left
                    L = right - left
                remove = s[left]
                left += 1
                if remove in target:
                    if memo[remove] == target[remove]:
                        valid -= 1
                    memo[remove] -= 1

        return '' if L == float('inf') else s[start:start+L]

```