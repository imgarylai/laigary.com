---
slug: "1930-unique-length-3-palindromic-subsequences"
section: "coding"
title: "1930. Unique Length-3 Palindromic Subsequences"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[1930\. Unique Length-3 Palindromic Subsequences](https://leetcode.com/problems/unique-length-3-palindromic-subsequences/)

看到回文的題目，通常都可以很直覺的想要用雙指針來做題目，可是這一個題目，我們要找的是長度為 **3** 的回文，我的直覺是想雙指針，可是這個方法這邊我一開始就有點卡住。不知道該怎麼做，是要靠動態規劃嗎？還是遞迴的方式去檢查？

我就先想了遞迴的方式，我先固定最左邊，去看最右邊是不是跟最左邊一樣，如果不一樣我就往內縮，那如果一樣呢？這樣看起來我不需要遞迴下去，可是在最左邊與最右邊中間可能還有很長的字串，我要怎麼處理？

在這裡我又再卡住了一次，到了這裡我才發現，不對，題目給的條件其實是在幫助我們，因為我們要找的回文長度只要 **3** ，所以如果說一個字串的左邊和右邊都確定了，那我只要知道中間有幾種不同的組合。

例如下面的字串，當我們確定最左最右都是 `a` 的時候，中間還有四個字串，但是是其實只是 `b, a, c` 三個的排列組合。

```text
abbaca 
1. aba
2. aaa
3. aca

```

觀察到這個組合後，其實自己覺得有進了一步，但是其實不知道這個觀察是有用還是沒有用的。

在這裡我的確又再卡住了一次，我仔細想想題目的限制，我們再次觀察上面的字串的時候，其實 `aba` 這個字串可以出現兩次，但是我們其實只能算一次，觀察到這裡，我就觀察到了另外一個現象，那就是以這個字串為例，如果我已經觀察過了 `a` ，那中間如果還有左右都是 `a` 的回文，其實都只是已經觀察做的子集合。所以我從另外一個角度想到了，我是不是應該從 `a` 到 `z` 的去計算，先看看有沒有兩邊都是 a 的回文，有的話，我找到最左邊與最右邊的 `a` ，然後就可以套入上面計算有幾種排列組合的方法，如果沒有，那就代表沒有兩頭為 `a` 的回文，接著繼續考慮 `b` 依此類推，接著算到 `z` 。

這樣硬寫其實應該是寫得出來的，到了這部之後，我們就可以比較有效率的來解決題目了，因為上面窮舉的條件，其實還要考量兩個點，例如，我看 `a` 的時候，如果 `a` 只出現了一次，那就代表了不可能有以 `a` 為兩側的回文，跳過不考慮，第二點是，`s` 可能根本沒有包含 `a` 到 `z` 的每一個字元，如果沒有的話，那我就也可以跳過，這兩個點我就可以一起考量。

{% hint style="info" %} 如果一個字母沒有出現兩次以上的話，我們就直接跳過不考慮 {% endhint %}

到了這裡其實才是問題的核心，我們要去算字串 `s` ，每個字串的頻率為何，這時候這個題目的核心就會變成用 `Hash Table` 解題，以字母為 `key` 以頻率為 `value` ，存入 `Hash Table` ，接著我們就去判斷每個 `c` 是否有出現兩次，如果有，我們找到最左邊的 `index` ，最右邊的 `index` ，接著計算出中間到底有哪些排列組合，並加總起來，就會是題目要求的，一個字串中有哪些長度為三的回文！

```python
class Solution:
    def countPalindromicSubsequence(self, s: str) -> int:
        if len(s) < 3:
            return 0
        elif len(s) == 3:
            return 1 if s[0] == s[2] else 0
        else:
            counter = Counter(s)
            ans = 0
            for key, val in counter.items():
                if val >= 2:
                    leftIndex = s.index(key)
                    rightIndex = s.rindex(key)
                    ans += len(set(s[leftIndex+1:rightIndex]))
            return ans

```