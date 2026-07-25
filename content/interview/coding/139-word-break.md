---
slug: "139-word-break"
section: "coding"
title: "139. Word Break"
status: "published"
pinned: false
tags: ["Backtrack", "Classic", "Dynamic Programming"]
created_at: 1674973128
updated_at: 1746327220
published_at: 1674973128
---
[139\. Word Break](https://leetcode.com/problems/word-break/)

這個題目的要求是給定一個字串與一個陣列，陣列裡面裡面有多個單字，目標是要回答，是否可以透過任意組合陣列裡面的單字，且陣列裡面的每個單字都是可以重複使用，可以拼湊出題目給的字串。

題目的要求很清楚，直覺的解法也是可以透過暴力解的方式來處理。但是暴力解的方式需要注意要確定方向，因為陣列裡面的單字可以重複使用，所以不能夠過無限窮舉出所有的單字的排列組合，再來確定組合中是否有目標。

因此暴力解的方向在於要怎麼從目標的字串漸漸的把所有的組合都給找完，排列的方式也很直覺，可以想像用拼圖的方式，把陣列中的每個單字當作一片拼圖，嘗試著把拼圖拼上去，如果能夠把拼圖拼完，就代表著可以找到目標。

但是這個題目沒有明講，但是會造成拼圖邏輯出問題的地方在於，有接單字可能會特別的長，他雖然一次可以覆蓋掉很多字元，但是其他的拼圖也就拼不上去了，例如：

```text
s = "abcde"
words = ["abcd", "abc", "de"]
```

當使用第一個單字 `abcd` 當作拼圖的時候，一下就可以蓋掉四個字元，但是剩下的拼圖中，沒有任何一個 `e` 可以拼完剩下的拼圖，這樣的話雖然 `abcd` 可以使用，但是是屬於沒有作用的拼圖。

這個題目的狀態轉移其實滿自由的，最主要是如果在目標字串中，前面 `i` 個位置的字元都已經檢查過了，只需要繼續檢查後面的字元就可以了，所以狀態轉移方程可以是傳遞檢查的位置 `i` 或是剩餘還沒檢查過的 `s[i:]` 字串。

$$
dp(i) = ∀ word ∈ wordDict, dp(i + len(word)) == True
$$

## 遞迴

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:

        def dfs(i):
            res = False
            // 選擇
            for word in wordDict:
                # word 比剩餘要檢查的字串還長
                if len(s[i:]) < len(word):
                    continue
                # word 無法拼入拼圖
                if s[i:i + len(word)] != word:
                    continue
                # 剩餘的字串如果拼得完
                if dfs(i + len(word)):
                    res = True
            return res
        
        return dfs(0)
```

上述的方式是比較適合閱讀，但是比較合適的寫法可以這樣改寫

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        
        def dfs(i):
            res = False
            for word in wordDict:
                # 剩餘的字串長度比當前要檢查的單字還長
                if len(s[i:]) >= len(word):
                    # 又剛好符合最前面的字元
                    if s[i:i + len(word)] == word:
                        # 當繼續拼圖下去可以拼完所有的拼圖
                        if dfs(i + len(word)):
                            res = True
            return res
        
        return dfs(0)
```

但是這樣並沒有終止條件，終止條件應該是當指針已經掃瞄完畢目標字串的所有字元時，代表已經拼完拼圖了。最後一個小優化是，題目給訂的陣列，可能存在著重複的單字，但是既然單字是可以重複使用的，而我們並不需要知道每個單字是否重複出現，可以在最一開始的時候就只使用不重複的單字。

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        
        wordDict = set(wordDict)

        def dfs(i):
            if i == len(s):
                return True
            res = False
            for word in wordDict:
                if len(s[i:]) >= len(word):
                    if s[i:i + len(word)] == word:
                        if dfs(i + len(word)):
                            res = True
            return res
        
        return dfs(0)
```

以下是上述所使用的利用剩餘的字串來做狀態轉移的方式。

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        wordDict = set(wordDict)
        def dfs(s):
            if len(s) == 0:
                return True
            for word in wordDict:
                if len(word) <= len(s):
                    if s.startswith(word):
                        if dfs(s[len(word):]):
                            return True
            return False
        return dfs(s)

```

而上面遞迴的方式存在著重複的子問題，可以透過記憶法的方式優化使用自頂向下的動態規劃來進一步提升效率。

## 自頂向下

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        
        wordDict = set(wordDict)

        @cache
        def dfs(i):
            if i == len(s):
                return True
            res = False
            for word in wordDict:
                if len(s[i:]) >= len(word):
                    if s[i:i + len(word)] == word:
                        if dfs(i + len(word)):
                            res = True
            return res
        
        return dfs(0)
```

## 自底向上

做法有點不直覺，處理的邏輯是一步一步走，去檢查每一個位置，有沒有機會可以用任何字典中的單字拼起來。檢查的邏輯如下：

例如：我站在某位置 `j` ，接著我就從位置 `i = 0` 一路檢查到位置 `j` ，看看有沒有辦法在位置 `i` 的地方其中 `s[i:j]` 剛好在字典裡面，但是這樣還不夠，那就是在位置 `i` 的地方，也要有字串可以到達才夠，如果兩個條件都滿足，那 `dp[j]` 就會是 True ，代表可以到達這個地方。

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:

        dp = [False] * (len(s) + 1)
        dp[0] = True

        for end in range(1, len(s)+1):
            for start in range(end):
                if dp[start] and s[start:end] in wordDict:
                    dp[end] = True
                    break

        return dp[len(s)]

```

## 回溯法

這一題其實也可以用回溯法來寫。參考 [140\. Word Break II](/interview/coding/140-word-break-ii)