---
slug: "125-valid-palindrome"
section: "coding"
title: "125. Valid Palindrome"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973111
updated_at: 1674973111
published_at: 1674973111
---
[125\. Valid Palindrome](https://leetcode.com/problems/valid-palindrome/)

回文的題目真的滿常讓我掛掉的，所以我想要記錄下來我怎麼克服這類型的題型的

## 雙指針

雙指針是一個很好想到的解法，從兩側往中間搜尋，終止條件是兩邊的指針到達中間位置了。

這裡是一個小地方要注意，那就是 `while` 的執行條件是要用 `left < right` 還是要用 `left <= right` ?

如果是 `left < right` 的話，代表的是當 `left` 大於或等於 `right` 的時候， `while` 就不再執行了 。這時候有兩種情況：

-   第一種是字串是偶數，指針到最中間的時候，兩個指針再繼續下一步時，**分別會跨中中間點**，那其實就代表了左側與右側的字元都檢查完畢了
-   第二種是字串是奇數，指針到最中間的時候，兩個指針再繼續下一步時，**會兩個點都剛好在中間點上面**，這時候就達到了 `while` 的終止條件，我們會少比較了一種情況，可是這個情況並不重要，因為兩個指針指在同一個字元上面，那該字元不管如何，都一定會相等，還是會滿足回文的條件。

如果是 `left <= right` 的情況，代表 `left` 要大於 `right` 才會終止 `while` 的執行，一樣可以思考兩種情況：

-   第一種是字串是偶數，指針到最中間的時候，兩個指針再繼續下一步時，**分別會跨中中間點**，那其實就代表了左側與右側的字元都檢查完畢了。和前一個情況一模一樣。
-   第二種是字串是奇數，其實就是補足了上一個情況中，最後沒有檢查到的最後一個字元，所以也是可以的。

```python
class Solution:
    def isPalindrome(self, s: str) -> bool:
        s = "".join([c.lower() for c in s if c.isalnum()])

        left = 0
        right = len(s) - 1
        while left <= right:
            if s[left] != s[right]:
                return False
            left += 1
            right -= 1
        return True

```

## 遞迴

了解後，其實這個題目也可以用遞迴的方式來寫，前面的鋪陳就是要寫出遞迴的終止條件：

遞迴的方式是我們不斷往中間去靠近，如果有出現錯誤的話，就會回傳 `False` ，最後一步就是當兩邊的指針分別跨越中線之後，就代表一定是一個回文，回傳 `True` 。其思考的模式和前面雙指針的方式相同。

```python
class Solution:
    def isPalindrome(self, s: str) -> bool:
        s = "".join([c.lower() for c in s if c.isalnum()])

        def helper(left, right):
            if left >= right:
                return True
            if s[left] == s[right]:
                return helper(left+1, right-1)
            if s[left] != s[right]:
                return False
        return helper(0, len(s)-1)

```

## 中心擴散法

最後還有一個前言有提到的從中心往左右延伸的情況，其重要注意的是，如果今天的字串是偶數，向右出發的指針需要比 `mid` 多 `1` 。

```python
class Solution:
    def isPalindrome(self, s: str) -> bool:
        s = "".join([c.lower() for c in s if c.isalnum()])


        mid = (len(s)-1) // 2
        left = mid
        right = mid
        if len(s) % 2 == 0:
            left = mid
            right = mid + 1

        while left >= 0 and right < len(s):
            if s[left] != s[right]:
                return False
            left -= 1
            right += 1
        return True

```