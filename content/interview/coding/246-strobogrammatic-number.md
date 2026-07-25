---
slug: "246-strobogrammatic-number"
section: "coding"
title: "246. Strobogrammatic Number"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972936
updated_at: 1674972936
published_at: 1674972936
---
[246\. Strobogrammatic Number](https://leetcode.com/problems/strobogrammatic-number/)

英文單字補充：[Strobogrammatic Number](https://en.wikipedia.org/wiki/Strobogrammatic_number) 一個數字經過 180 旋轉後，如果還是一個合法的數字，那就是 Strobogrammatic Number 。

這是一題沒有任何實際的應用意義，題目並不難，面試中遇到題目考察的點在於面試者是否可以清楚地問清楚面試官想要給的定義，例如：`1` 到底算不算是？因為像是不同字型的 1 vs `1` 寫起來就不一樣，如果 1 寫得像是 | ，那就是 Strobogrammatic Number 。

問清楚後，只要可以建立一個字典去列出所有的映射，比較特別的就只有 6 和 9 。因為會把整個字串 180 度旋轉，所以有兩個方向，一是從字串的最後一個字元開始去處理，二是從字串的第一個字開始處理，再反左右翻轉一次就可以。

遍歷的時候可以去判斷，如果一個字元沒有在字典裡面出現，那就一定沒辦法變成 Strobogrammatic Number ，可以提早的返回 False ，組合完兩個字串後互相比較就好了。

時間複雜度為 $O(n)$ 。

```python
class Solution:
    def isStrobogrammatic(self, num: str) -> bool:
        table = {
            '1': '1',
            '6': '9',
            '8': '8',
            '9': '6',
            '0': '0'
        }

        reverseStr = ''
        for i in reversed(range(len(num))):
            char = num[i]
            if char not in table:
                return False
            reverseStr += table[char]

        return num == reverseStr

```