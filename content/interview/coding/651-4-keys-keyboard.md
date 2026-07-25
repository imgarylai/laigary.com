---
slug: "651-4-keys-keyboard"
section: "coding"
title: "651. 4 Keys Keyboard"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674965205
updated_at: 1674965278
published_at: 1674965205
---
[651\. 4 Keys Keyboard](https://leetcode.com/problems/4-keys-keyboard/)

這個題目滿有趣的，為了幫助大家對這個題目有更深的印象，我分享一個小故事，我在剛開始學寫程式的時候，是從 HTML 和 CSS 開始學起，當時看到迴圈就頭痛，以為只要學好 HTML 加上 CSS 就能當前端工程師，那時候響應式設計剛興起，Twitter Bootstrap 才剛出了第一版，我為了要測試當網站的內容很多的時候，看看網站變得很長會怎麼樣，也就很土法煉鋼的複製一段文字，接著一直貼上，貼了幾段後發現，我應該要全選所有的文字，再重新複製一次，在繼續一直貼上，這樣子一次會產生更多的內容會更快，一直貼上到一定的程度後，就要重新再全選一次、複製、再繼續動作...不斷重複。

這一個題目設計的情況就是這樣，有一個鍵盤，只有四個按鈕：A，全選，複製，貼上。我們可以隨便按任何鍵，可是總共按的次數只有 `n` 次。試問我們要怎麼樣建立出最長的一個字串？

以前我在複製的時候很隨性，也不會寫程式，沒有認真的想過這個動作是可以被最大化的，不過這次就透過題目來好好分析看如何最大化吧。

這個執行動作其實很像是七傷拳，因為每次我要執行全選、複製、貼上的時候，就會消耗掉三個動作，之後雖然可以靠貼上不斷的增加長度，可是如果沒有重新選擇與複製，當字串總長度越長的時候，貼上的增加的長度也會越來越雞肋。

第一個重點就是，其實當 n 小於 7 的時候，全選、複製、貼上其實完全沒有意義，因為每一個動作在這裡影響的百分比都很高，例如當 `n = 4` 的時候三個動作佔了 75% ，可是對長度一點的貢獻只有 1 而已，遠不及我直接按四次 A 就好，這個現象要一直到 n 超過了 7 才有意義，到了這裡，我們就可以開始從 n > 7 以後開始處理。

但是要如何想到用動態規劃來處理呢？因為如果要執行全選、複製、貼上的時候，我們會希望在執行這個動作之前，文字的最大長度已經是最佳解了，也就是每個位置上，都是一個子問題而且可以依靠之前的答案來幫助我們現在找到答案。

這裡我們就可以寫出答案了，可以用動態規劃的自底向上的方式來找答案，Base case 就是如果我有 n 個次數可以按，我就不用複製貼上，直接按到底。

```python
class Solution:
    def maxA(self, n: int) -> int:
        
        dp = [i for i in range(n+1)]
        
        for i in range(7, n+1):
            dp[i] = max([dp[j]*(i-j-1) for j in range(i-3)])
        
        return dp[n]

```
```python
class Solution:
    def maxA(self, n: int) -> int:        
        dp = [i for i in range(n+1)]
        
        for i in range(7, n+1):
            dp[i] = max(dp[i-3]*2, dp[i-4]*3, dp[i-5]*4)
        
        return dp[n]

```
```python
class Solution:
    def maxA(self, n: int) -> int:
        
        dp = [i for i in range(n+1)]
        
        for i in range(len(dp)):
            for j in range(1, i-2):
                dp[i] = max(dp[i], dp[j]*(i-j-1))
        
        return dp[n]

```