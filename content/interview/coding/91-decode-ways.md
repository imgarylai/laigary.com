---
slug: "91-decode-ways"
section: "coding"
title: "91. Decode Ways"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944829
updated_at: 1765263277
published_at: 1674944829
---
[91\. Decode Ways](https://leetcode.com/problems/decode-ways/)

這題的題目是如果說給出一串字串，由數字組成，如果要轉換成英文，可以轉換成幾種方式？其中比較特別的就是如果兩個數字剛好不是零為開頭，那像是 `"11"` 就可以變成 `aa` 或是 `k` 像這樣的題目滿像是走樓梯問題的，一次可以走一步或兩步，不過呢，需要注意的是什麼樣的情況下可以走，以及邊界的情況。

既然是走樓梯問題，那就可以先用走樓梯問題的方式來建構題目。

```python
class Solution:    
    def numDecodings(self, s: str) -> int:      
        def recursive(index: int) -> int:
            # TODO 
            ans = recursive(index + 1)
            ans += recursive(index + 2)
            return ans
        return recursive(0)
```

我先一算出走一步的有幾種組合，再加上走兩步的有幾種組合，那應該就是答案了吧？很接近，但是我們要注意的是只有 10 ~ 26 是有機會可以當作兩步走的。

```python
class Solution:    
    def numDecodings(self, s: str) -> int:      
        def recursive(index: int) -> int:
            # TODO 
            ans = recursive(index + 1)
            if 10 <= int(s[index : index + 2]) <= 26:
                ans += recursive(index + 2)
            return ans
        return recursive(0)
```

到了這裡，我們會發現這個遞迴會無限的走下去，因為沒有終止條件。

有哪些終止條件呢？

第一種情況 `s[index] == '0'` ，以 '10' 來看，先遞迴 `'1'` 接著是 `'0'` ，走到 `'0'` 的瞬間，沒有英文的組合，所以要退回，**返回零種組合**，這時候走一步的情況無法，接著因為 `10` 符合條件，所以再走往前走二步，這時候會發生 `index == 2` 越界的情況。而能夠發生這種情況的，都因為一定會符合這個條件：`10 <= int(s[index : index + 2]) <= 26` ，所以會促成下一個終止條件。

第二種情況 `index == len(s)` 這個會比較難想一點，需要靠上面的例子來想出來，**返回一種組合**。

第三種情況 `index == len(s) - 1` 這個很簡單，因為當條件成立，我們走到了最後一位，且也不是 `'0'` ，所以說可以直接**返回一種組合**。

而且這題最困難的一個地方，是這三個條件，是有順序性的，一定要是按照以下的方式：

```python
class Solution:
    def __init__(self):
        self.memo = {}

    def numDecodings(self, s: str) -> int:

        def recursive(index: int) -> int:
            # 要先處理越界，不然下一個條件會報錯
            if index == len(s):
                return 1
            # 再來要看是不是零，因為有可能最後一個數字是零
            if s[index] == '0':
                return 0
            # 沒有越界，也不是零，才是真的到達了終點
            if index == len(s) - 1:
                return 1

            ans = recursive(index + 1)
            if 10 <= int(s[index:index + 2]) <= 26:
                ans += recursive(index + 2)
            return ans
        return recursive(0)
```

到了這裡，就會發現其實會有很多重疊的子問題，例如：`1111111` 這樣的組合，就會有很多的重疊子問題，但因為我們有了遞迴的關係，我們可以直接用自頂向下的方式來記憶。

## 自頂向下

```python
class Solution:
    def numDecodings(self, s: str) -> int:
        
        @cache
        def dp(i):
            if i >= len(s) - 1:
                return 1
            if int(s[i]) == 0:
                return 0
            ans = dp(i + 1)
            if 10 <= int(s[i:i+2]) <= 26:
                ans += dp(i + 2)
            return ans
        return dp(0)
```