---
slug: "1295-find-numbers-with-even-number-of-digits"
section: "coding"
title: "1295. Find Numbers with Even Number of Digits"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674843324
updated_at: 1685506705
published_at: 1674843324
---
[1295\. Find Numbers with Even Number of Digits](https://leetcode.com/problems/find-numbers-with-even-number-of-digits/)

這一題其實很像是小學剛開始初學位數以及判斷奇數與偶數的混合題目，老師會給定一連串數字，我們要先判斷每個數字是幾位數，接著我們要再判斷當一個數字是 $n$ 位數時，這個 $n$ 是一個奇數還是偶數。

這個題目有一個作弊方法，那就是直接把數字轉換成字串，接著判斷字串的長度，得知的長度後，就可以進而判斷出該數字是奇數還是偶數，並且得出有幾個符合條件的數字。

```python
class Solution:
    def findNumbers(self, nums: List[int]) -> int:
        return sum([1 for num in nums if len(str(num)) % 2 == 0])
```

以上做法當然滿符合題目原意的，不過我們都知道這一題真的想問的實作應該是要怎麼不考字串長度的判斷，進而用數學的方法，並透過程式的實作來判斷出位數。

在十進位中，要如何判斷一個數字是一個幾位數數字呢？

1.  如果一個數字除以十的商數不為零，那就可以先計數一個位數
2.  接著我們就可以把商數再做一次除以十的運算
3.  重複以上步驟，直到商數為零
4.  當商數為零的時候，我們就要判斷餘數
5.  如果餘數為零，上面的計數就是總共的位數
6.  如果餘數不為零，上面的計數加一就是總共的位數

以上的步驟，就可以發現其有遞迴的規則，可以用以下的程式實作出來其遞迴關係式：

```python
def n_digit(num):
    if num // 10 >= 1:
        return 1 + n_digit(num//10)
    else:
        if num % 10 > 0:
            return 1
        else:
            return 0
```

最後判斷偶數的實作非常簡單就不再贅述了，組合起來的完整解法為

```python
class Solution:
    def findNumbers(self, nums: List[int]) -> int:
        
        def n_digit(num):
            if num // 10 >= 1:
                return 1 + n_digit(num//10)
            else:
                if num % 10 > 0:
                    return 1
                else:
                    return 0
                
        def is_even(num):
            return num % 2 == 0
        
        count = 0
        for num in nums:
            if is_even(n_digit(num)):
                count += 1
        
        return count
```