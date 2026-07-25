---
slug: "5-longest-palindromic-substring"
section: "coding"
title: "5. Longest Palindromic Substring"
status: "published"
pinned: false
tags: ["Classic", "Dynamic Programming", "Palindrome", "Two Pointers"]
created_at: 1674973129
updated_at: 1722574003
published_at: 1674973129
---
[5\. Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/)

這一題是我們要找出子字串中的最長的回文，其實最好從暴力解法開始學習起，前面的題目已經重複提過了好多次的回文的性質，這裡就用暴力法先來思考以下。

## 暴力法 (TLE)

那暴力法的方式就是我們窮舉出所有的子字串，並去看看哪一個字串是回文，而且長度最長就好了，窮舉的方式如下，直接就先固定左標，滑動右標一個一個把子字串窮舉出來。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        substrings = []
        # i 不用走到最後，因為走到最後的話就等於沒有字元了        
        for i in range(len(s)-1):
            # j 直接從 i 的下一個字元開始看起即可，長度為一個字元不用考慮。
            for j in range(i+1, len(s)):
                substrings.append(s[i:j+1])

```

這裡也先回憶回文的特性，**其中之一就是最短的回文就是只有一個字元**，所以我們今天要找的一定是要看看有沒有大於一個字元以上的回文，如果沒有的話，從字串裡面隨便選一個字元就是答案了，這就是預設的答案，緊接著用 [125\. Valid Palindrome](/interview/coding/125-valid-palindrome) 的方法，求出最長的回文子字串。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        substrings = []        
        for i in range(len(s)-1):
            for j in range(i+1, len(s)):
                substrings.append(s[i:j+1])

        def isPalindrome(substring):
            left = 0
            right = len(substring) - 1
            while left < right:
                if substring[left] != substring[right]:
                    return False
                left += 1
                right -= 1
            return True

        ans = s[0]
        for substring in substrings:
            if isPalindrome(substring):
                if len(substring) > len(ans):
                    ans = substring
        return ans

```

不過其實這道題目我們也不一定要一直更新字串，只要知道索引就好，為什麼 `length` 是用 `j - i + 1` 是因為，我們需要的答案是閉區間。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:

        def isPalindrome(left, right):
            while left < right:
                if s[left] != s[right]:
                    return False
                left += 1
                right -= 1
            return True

        start = 0
        length = 1
        for i in range(len(s)-1):
            for j in range(i+1, len(s)):
                if isPalindrome(left, right) and j - i + 1 > length:
                    length = j - i + 1
                    start = i

        return s[start:start+length]

```

如果是第一次寫這個題目，可以想到這個方法其實不差，不過這個解法因為他的時間複雜度是 $O(n^3)$ ，在面試的時候應該會繼續被問到，是不是可以提供 $O(n^2)$ 的方法？要想到就會比較難了。

## 動態規劃

動態規劃的核心思想是要判斷字串從 `i` 到 `j` 是不是一組回文，如果說 `s[i]` 和 `s[j]` 相等，又知道 `s[i-1..j-1]` 已經是回文的話，那就可以確定 `s[i..j]` 是回文，也就是說子問題是判斷更小的字串是不是回文，是的話，那只要更大的問題滿足條件像是 `s[i]` 和 `s[j]` 相等，那就可以回答 `s[i..j]` 是回文。（這裡的表示法跟 Python 不同，因為 Python 是左閉右開，用 Python 的表達方式會怪怪的。）

所以這題可以用動態規劃的方式來思考

💡

`dp[i][j]` 代表的是字串 `s` 以索引 `i` 開始，到 `j` 結束的這個閉區間內，是不是回文？

狀態轉移方程式，頭尾要是一樣的字，且中間字串是回文

```text
dp[i][j] = s[i] == s[j] and dp[i+1][j-1]

```

既然是處理字串的位置，所以就有邊界的情況要處理。

今天我們判斷的首尾兩個字元，又是回到了我們講的回文兩種型態，一種是回文是奇數個數，一種是回文是偶數個數。

如果今天奇數個數在判斷首尾的時候，剛好是在正中心的點的左右兩側，那今天 `dp[i+1][j-1]` 其實會是 `False` ，我們要避免這種情況，所以如果今天 `j-1 - (i+1) + 1 <= 1` 的情況，那 `dp[i][j]` 應該要是 `True` ，偶數其實亦然。這就是為何 `L17` 要做這樣的判斷。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:

        n = len(s)

        dp = [[False for _ in range(n)] for _ in range(n)]

        for i in range(n):
            dp[i][i] == True

        start = 0
        maxLen = 1

        for end in range(1, n):
            for begin in range(end):
                if s[begin] != s[end]:
                    dp[begin][end] = False
                else:
                    if (end - 1 - (begin + 1) + 1 <= 1):
                        dp[begin][end] = True
                    else:
                        dp[begin][end] = dp[begin+1][end-1]
                if dp[begin][end] and end - begin + 1 > maxLen:
                    maxLen = end-begin + 1
                    start = begin

        return s[start:start+maxLen]

```

下面是上面的程式碼整理過後的結果，但是閱讀性比較差，建議理解上方的就好，但是能夠完整了表達出動態轉移方程

```python
dp[begin][end] = s[begin] == s[end] and (dp[begin+1][end-1] or (end-begin) <= 2))

```
```python
class Solution:
    def longestPalindrome(self, s: str) -> str:

        n = len(s)

        dp = [[False for _ in range(n)] for _ in range(n)]

        for i in range(n):
            dp[i][i] == True
        start = 0
        maxLen = 1
        for end in range(1, n):
            for begin in range(end):
                dp[begin][end] = s[begin] == s[end] and (dp[begin+1][end-1] or (end-begin) <= 2)
                if dp[begin][end] and end - begin + 1 > maxLen:
                    maxLen = end-begin + 1
                    start = begin
        return s[start:start+maxLen]

```

但是動態規劃的時間複雜度是 $O(n^2)$ ，我在第一次寫的時候 LeetCode 是可以通過的，但是後來複習的時候，這個方法超時了。

## 中心擴散法

下一個方法是利用回文的另一個特性，那就是回文除了從兩側找，也可以從中心找，從中心判斷是不是回文的情況，其複雜度也是只有 $O(n)$ ，而如果我們把每個字元都當作中心點擴散，遍歷完所有的中心點也就是遍歷了字串中的所有字元，那時間複雜度也可以在 $O(n)$ 。最壞的時間複雜度就是在 $O(n^2)$。

但是使用中心擴散法，就要注意在 [125\. Valid Palindrome](/interview/coding/125-valid-palindrome) 裡面中心擴散法要注意的是要判斷回文的長度是奇數還是偶數。

這個題目的中心擴散法要求的，是我們要看從中心開始展開的時候，可以展開到多少的長度，我們就先看這個部分：

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        def getPalindromeLen(left, right):
            while left >= 0 and right < len(s):
                if s[left] != s[right]:
                    break    
                left -= 1
                right += 1

            return right - left + 1 - 2

```

首先傳進來的座標點是中心點，中心點會有分 `left` 和 `right` ，是因為回文的特性，回文有分奇數長度和偶數長度，就像在 [125\. Valid Palindrome](/interview/coding/125-valid-palindrome) 的中心擴散法一樣，我們針對偶數求中心點時，向右行的指針要加一。

這裡有第二的地方要注意，我沒有把它簡化，那就是最後一個回傳值為什麼是這麼奇怪的 `right - left + 1 - 2` 減二的原因是因為在 while 迴圈裡面，我們是兩個指針分別向外個走一步後，才發現不是回文的，所以多走了兩部要剪掉。如果還是不好想，可以試著用回文的特性想看看。

1.  奇數的 `abc` ，傳入 `left = 1, right = 1` 時，`while` 迴圈的 `if` 條件不會觸發，所以指針會向左向右個一步，變成 `left = 0, right = 2` ，這時候我們要回傳的回文長度應該是 `1` 才對，把變數帶入：`(2 - 0) + 1 - 2 = 1` 正確。
2.  偶數的 `abab` 傳入 `left = 1, right = 2` 時，while 迴圈裡的 if 條件會觸發，所以指針不動，依然是`left = 1, right = 2` 這時候回文的長度應該是 0 ，把變數帶入：`(2 - 1) + 1 - 2 = 0` 正確。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        def getPalindromeLen(left, right):
            while left >= 0 and right < len(s):
                if s[left] != s[right]:
                    break    
                left -= 1
                right += 1

            return right - left + 1 - 2

        start = 0
        max_length = 1
        for i in range(len(s)):
            odd = getPalindromeLen(i, i)
            even= getPalindromeLen(i, i+1)
            curr = max(odd, even)
            if curr > max_length:
                max_length = curr
                start = i - (max_length - 1)//2

        return s[start:start+max_length]

```

最後，我們第一個字元開始掃描到最後一個字元，至於 `for` 最終的邊界是 `len(s)` 或是 `len(s)-1` 其實沒關係，因為如果真的越界了，`getPalindromeLen` 就有處理了越界，不會造成錯誤。謹慎一點應該要寫 `len(s)-1` 這裡只是作為註記所以寫了 `len(s)` 。

至於為何會有 `odd` 和 `even` ，寫到這裡已經覆述了好多次回文的特性，因為我們擴展時，要同時考兩回文是奇數的型態，或是偶數的型態，然後我們看哪種型態的回文長度比較長，我們就更新比較長的回文長度。

走到這裡，是這題的的最後一個難點了，那就是我們從中間點出發了，我們要怎麼透過長度與中間點找回出發點，很簡單，既然我們在中間點，那就從中間點減去長度的一半就好，那為什麼會需要減一？一樣又是回文的奇數與偶數的情況。

例如：找到的最長回文字串時，出發的中點是 7 ，如果最大長度是 5 ，那回文字串是奇數，那回文的索引範圍是：5, 6, 7, 8, 9， 起始點是 5 ，`7 - (5-1)//2 = 5` 正確。如果最大長度是 4 ，是偶數，那回文的索引範圍是：6, 7, 8, 9 ，起始點是 6 ，`7-(4-1)//2 = 6` 正確。這個減一在程式裡的除法中剛好會讓奇數少 1 偶數少 2 ，剛好是中間點的數量個數。

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        

        def isPalindrome(left, right):
            while left >= 0 and right < len(s) and s[left] == s[right]:
                left -= 1
                right += 1
            
            return s[left + 1 : right]
        
        res = ""

        for i in range(len(s)):
            s1 = isPalindrome(i, i)
            s2 = isPalindrome(i, i + 1)
            res = s1 if len(s1) > len(res) else res
            res = s2 if len(s2) > len(res) else res
        
        return res

```