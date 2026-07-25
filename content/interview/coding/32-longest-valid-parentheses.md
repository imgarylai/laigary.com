---
slug: "32-longest-valid-parentheses"
section: "coding"
title: "32. Longest Valid Parentheses"
status: "published"
pinned: false
tags: []
created_at: 1766516917
updated_at: 1784779464
published_at: 1766516917
---
[32. Longest Valid Parentheses](https://leetcode.com/problems/longest-valid-parentheses/)

這個題目我第一次嘗試的時候，是基於 [20. Valid Parentheses](/interview/coding/20-valid-parentheses) 的思路來思考的，如果遇到左括號 "(" ，那我就先放進去 Stack 裡面，如果遇到右括號 ")" 時，再來處理合法性的問題。

我的實作如下：

```python
class Solution:
    def longestValidParentheses(self, s: str) -> int:
        tmp = 0
        res = 0
        stack = []

        for c in s:
            if c == "(":
                stack.append(c)
            else:
                if not stack:
                    res = max(tmp, res)
                    tmp = 0
                    continue
                else:
                    stack.pop()
                    tmp += 2
            
        res = max(res, tmp)
        return res
```

不過這是一個困難的題目，沒意外的話就是要出意外了，上面的這樣的方法，可以處理右括號如果不對的情況。但是如果是在 Stack 裡面，如果我們有多額外存的開始的左括號 ，就會沒有辦法處理。

而且我們也不能在結束的時候再處理，因為我們並不知道 左括號的**「位置」**為何，因此如果題目給定的字串有額外的左括號時，就會出現錯誤，例如

```text
()(()
```

- 前兩個 `()` 讓 `tmp` 變成 2。
- 接下來遇到兩個 `((`，你的程式碼只是把他們推入 `stack`。
- 最後一個 `)` 抵銷掉一個 `(`，`tmp` 變成 4。
- **問題點：** 其實中間那個 `(` 已經把長度切斷了，合法的應該只有最後的 `()` (長度 2)，但你的 `tmp` 卻把前面的長度也算進來了。

---

透過上面的觀察，我們發現很重要的一件事情，比起存字串，我們更在乎的是位置，因為只有透過位置我們才能知道相對的合法括號區間如何，我們需要知道「**這段合法長度是從哪裡開始斷掉的**」。

如果我們把 **「索引值 (Index)」** 存進 Stack 會發生什麼事？

1. **遇到 `(`：** 我們把它的 **Index** 存進去。這就像是在地圖上插一根旗子 🚩，標記：「這裡有一個可能的起點」。
2. **遇到 `)`：**
  - 我們一樣執行 `pop()`。
  - **關鍵在於：** `pop()` 完之後，如果 Stack 裡面還有東西，Stack 頂端的那個 Index，是不是就是「最近一個**還沒被配對**的邊界」？

想像字串是 `s = "()(()"`，索引分別是 `01234`。

我們在開始之前，先在 Stack 放入一個 `-1` 作為「虛擬邊界」（代表起點前的位置）。

- `i = 0`, `(` -&gt; Stack: `[-1, 0]`
- `i = 1`, `)` -&gt; `pop()` 掉 `0`。現在 Stack 頂端是 `-1`。
  - **這時候，目前的合法長度可以用 `i - stack[-1]` (也就是 `1 - (-1) = 2`) 計算出來**
- `i = 2`, `(` -&gt; Stack: `[-1, 2]`
- `i = 3`, `(` -&gt; Stack: `[-1, 2, 3]`
- `i = 4`, `)` -&gt; `pop()` 掉 `3`。現在 Stack 頂端是 `2`。
  - **這時候，目前的合法長度 `i - stack[-1]` 會是多少？這個數字代表了什麼？**

上面這樣的邏輯，就可以很好的處理左括號的數量太多的問題，因為如果 pop 的數量不夠多，Stack 就會繼續保持目前的斷點在哪裡。

上面的邏輯很好的處理左括號太多的問題，但是如同我第一個做法一樣，這樣的邏輯還沒有思考到右括號太多的問題，如果我們遇到 **「連 Stack 頂端的斷點都被 pop 掉」** 的情況會發生什麼事？

當你執行 `pop()` 卻發現 Stack 變空時，代表原本的基準點（也就是那個 `-1`）已經被消耗掉了。這意味著**目前的 `)` 是一個多餘的、不合法的括號**，它切斷了之前的連續性。

如果我們不把現在這個 `i = 2` 放回去，後面的計算就會失去參考點。所以，當 Stack 為空時，我們就把目前的索引 `i` **推入（Push）** Stack。

到此為止，我們其實也不用再擔心基準點 `-1` 不在的問題了，因為當斷點發生後，斷點之後的所有狀態跟前面的狀態都是獨立的。

自此，這個題目的邏輯就完整了，我覺得這是一個非常好的「困難」的題目，邏輯是可以推敲出來的，需要冷靜分析題目的狀態，最後的實作其實並不困難。

```python
class Solution:
    def longestValidParentheses(self, s: str) -> int:
        res = 0
        stack = [-1]

        for i, c in enumerate(s):
            if c == "(":
                stack.append(i)
            else:
                stack.pop()
                if not stack:
                    stack.append(i)
                res = max(res, i - stack[-1])
        
        return res

```

時間複雜度跟空間複雜度的分析相對容易，都是 $O(n)$。