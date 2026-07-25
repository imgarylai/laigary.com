---
slug: "3-longest-substring-without-repeating-characters"
section: "coding"
title: "3. Longest Substring Without Repeating Characters"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1722574524
published_at: 1674972895
---
[3\. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

這一題其實是可以透過暴力解法想辦法算出來的，那就是窮舉出所有的子字串，並且檢查每一個子字串有沒有重複的字元。時間複雜度約為 $O(n^3)$ 。

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        def check(start, end):
            chars = defaultdict(int)
            for i in range(start, end + 1):
                c = s[i]
                chars[c] += 1
                if chars[c] > 1:
                    return False
            return True

        n = len(s)

        res = 0
        for start in range(n):
            for end in range(start, n):
                if check(start, end):
                    res = max(res, j - i + 1)
        return res

```

不過這一題的做法算是雙指針的初始練習題，要第一次寫就想到的確不容易，不過可以從這個題目練習核心的觀念

原先的暴力窮舉法最主要是不斷的重複的掃描重複的地方，但是我們如果使用雙指針的話，就可以盡可能地減少重複掃描的的動作。

要做到這個目的，我們還需要一個方法來記錄**不重複的字元**。我一開始是想到用 `set()` 來記錄，不過這樣的話我們沒辦法知道次數，而且這個重複字元不一定是在最後一個字元，所以我想到了用 `Hash Table` 來記錄，每次掃瞄一個字元的時候，我們就馬上檢查這個字元是不是出現兩次了，那這時候慢指針就會開始往右掃描，每次掃到一個字元，就從 `Hash Table` 上減去一個計數，直到計數只剩一次為止。

1.  我們需要想的是窗口增大的時候，需要更新哪些資訊？
2.  計算每個字元的計數
3.  何時要收縮窗口？
4.  如果該字元的計數大於 1
5.  收縮窗口時，需要更新哪些資訊？
6.  減少該字數的計數直到小於或等於 1
7.  最終結果要在「擴大窗口」時更新還是「收縮窗口」時更新？
8.  收縮完窗口後，計算出目前最長的不重複字元字串是多少

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        left = 0
        right = 0
        res = 0
        visited = defaultdict(int)

        while right < len(s):
            char = s[right]
            right += 1
            visited[char] += 1

            while visited[char] > 1:
                d = s[left]
                left += 1
                visited[d] -= 1
            res = max(res, right - left)

        return res

```