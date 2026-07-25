---
slug: "66-plus-one"
section: "coding"
title: "66. Plus One"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[66\. Plus One](https://leetcode.com/problems/plus-one/)

這是加一系列的第一題，其實最好想這道題目的方法就是小學時候學的直式加法，直式加法就是從最末位開始加，並且不斷的把進位帶進去下一個位數。

在程式裡面要做直式加法，可以將題目給的陣列反過來遍歷，這個題目的問題很簡單，只有加一而已，所以我們就在最後一個位數加一。

既然我們是反著遍歷，答案會從最後一位的開始取得，題目的要求是回傳後的答案也是要用陣列來表示，所以我先不考慮取得答案的順序是不是我們要的，我只要先按照順序記錄起來就好。

在遍歷的時候，有哪些情況要考量呢？

1.  最後一位數要加一
2.  如果前面遍歷的的運算有造成進位要加一
3.  運算完上面兩種情況，判斷下一次遍歷是否需要進位？（條件二的進位就是從這裡來的）

以上的一和二可以一起來看，因為任何一個條件滿足，要做的事情都是加一，加完一後要做的事情也都是一樣的，所以最後的程式碼如下：

```python
class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:
        m = len(digits)
        res = []
        carry = False
        for i in reversed(range(m)):
            if carry or i == m - 1:
                digit = digits[i] + 1
                res.append(digit % 10)    
                carry = digit > 9
            else:
                res.append(digits[i])
        if carry:
            res = res + [1]
        return reversed(res)

```

最後有一種例外狀況要記得處理，那就是遇上 9, 99, 999, 9999….這種輸入全是九的情況，因為這樣的情況，會造成迴圈跑完後，最後一個進位沒有處理到，因此迴圈結束後要再做最後一次的進位判斷。

這個方法的時間複雜度是 $O(n)$ 和最優解相同，只要一次遍歷，不過空間複雜度也是 $O(n)$ 。

下面的一個方法是 LeetCode 上別人提出的解法，這個解法只針對這個題目，不過想法很聰明，很值得一看，我覺得不要太奇淫技巧的解法都可以幫助思考，在面試時腦袋可以比較靈活。

這個題目有其自身的限制，我們最需要擔心的，就是「最右邊」的數字是不是九，如果不是九的話，其實加一後就沒有事情了，但如果是九，加一後就要進位，繼續看看「左邊」一個數字是不是九。例如：`[9,9,9]` 這樣的情況，遍歷的方法和直式加法一樣。

最後的程式碼需要花一點時間理解，不過真的非常簡潔。

```python
class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:

        for i in reversed(range(len(digits))):
            if digits[i] == 9:
                ## 連續遇到 9 就是一直加
                digits[i] = 0
            else:
                # 因為是反著遍歷，所以說很有可能一開始就直接加一就返回
                # 如果或是上一次是 9 這次不是 9 ，所以直接加一
                digits[i] += 1
                return digits
        # 遇到全部都是 9 的情況，只好再加一
        return [1] + digits

```