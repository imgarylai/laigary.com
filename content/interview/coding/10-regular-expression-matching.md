---
slug: "10-regular-expression-matching"
section: "coding"
title: "10. Regular Expression Matching"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674965025
updated_at: 1674965187
published_at: 1674965025
---
[10\. Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/)

這一題是正規表達式的題目，主要有兩個符號要考慮：「.」和「\*」，點號和星號，點號比較好處理，因為只要是點好，就代表可以跳過該字元，最難處理的是星號；因為星號可以代表的是該字元可以出現零到無限次。其中又以`.*` 代表的是可以符合任何字元無限次。

下面是如果只以 `.` 當作匹配的字串時所做的考量。

```python
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        i = 0
        j = 0
        while i < len(s) and j < len(p):
            if s[i] == p[j] or p[j] == '.':
                i += 1
                j += 1
            else:
                return False

        return i == j
```

1.  當 `s[i] == p[j] or p[j] == '.'` :
    1.  `p[j+1] != '*'` 兩個指針往前走。
    2.  `p[j+1] == '*'` 可以匹配零到多個字元，例如匹配零個字元：`s = "aa", p = "a*aa"` 匹配多個字元：`s = "aaa", p = "a*"` 。
2.  當 `s[i] != p[j]` :
    1.  `p[j+1] != '*'`不匹配，回傳 False
    2.  `p[j+1] == '*'` 只能匹配零個字元，例如：`s = "cc", p = "ca*c"` 。

分析到這裡，最困難的就是 1-2 到底要怎麼選擇，到底要不要匹配字元，於是我們可以改寫

```python
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        memo = {}
        def dp(i, j):
            res = False
            if s[i] == p[j] or p[j] == '.':
                if j < len(p) - 1 and p[j + 1] == '*':
                    #        dp 匹配多次 or 一次都不要匹配
                    res = dp(i + 1, j) or dp(i, j + 2)
                else:
                    res = dp(i + 1, j + 1)
            else:
                if j < len(p) - 1 and p[j + 1] == '*':
                    res = dp(i, j + 2)
                else:
                    res = False
            memo[(i, j)] = res
            return memo[(i, j)]

        return dp(0, 0)

```

可是到了這一步還沒有結束，因為我們要知道 Base case 的終止條件。

第一個終止條件很簡單，那就是 `j` 指針指向 `p` 的終點的時候，`i` 剛好也在 `s` 的終點。

```python
if j == len(p):
    return i == len(s)

```

可是當 `i` 在 s 的終點的時候不能只是簡單的判斷 `j` 是不是也在終點，例如：`p` 在 `j` 位置之後是一連串的 `a*b*c*d*a*c*...` 這樣的字串。這些判斷是都可以是作為空字串的判斷。

要做出這樣的判斷有二個條件，第一個條件是這串字串一定要是偶數長度，如果是奇數長度就不用考慮一定是回傳 False 。

當是偶數後，才進行第二個判斷，這串出現星號的字串一定是**一個字母或甚至一的點號加上星號。**

這裡有兩個方法，由於所以可以乾脆去用星號分開所有的字元，如果說有字元的長度超過 1 ，那就代表還有一個字元需要匹配，回傳 False ，如果說所以的字元都檢查完了，都有星號那就可以回傳 True

```python
if i == len(s):
    if (len(p) - j) % 2 == 1:
        return False
    else:
        rest = p[j:].split('*')
        for char in rest:
            if len(char) > 1:
                return False
        return True

```

又或是另一種檢查法，每次跳兩格，一路檢查到看是不是星號。

```python
if i == len(s):
    if (len(p) - j) % 2 == 1:
        return False
    else:           
        for k in range(j, len(p)-1, 2):
            if p[k+1] != '*':
                return False
        return True

```

兩種方法都可以，可以看自己想要怎麼選擇。

## 自頂向下

```python
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        memo = {}
        def dp(i, j):
            if j == len(p):
                return i == len(s)
            if i == len(s):
                if (len(p) - j) % 2 == 1:
                    return False
                else:
                    rest = p[j:].split('*')
                    for char in rest:
                        if len(char) > 1:
                            return False
                    return True
            res = False
            if s[i] == p[j] or p[j] == '.':
                if j < len(p) - 1 and p[j + 1] == '*':
                    #        dp 匹配多次 or 一次都不要匹配
                    res = dp(i + 1, j) or dp(i, j + 2)
                else:
                    res = dp(i + 1, j + 1)
            else:
                if j < len(p) - 1 and p[j + 1] == '*':
                    res = dp(i, j + 2)
                else:
                    res = False
            memo[(i, j)] = res
            return memo[(i, j)]

        return dp(0, 0)

```

## 自底向上

### TODO

```python
class Solution:
    def isMatch(self, s: str, p: str) -> bool:

        dp = [[False for _ in range(len(s) + 1)] for _ in range(len(p) + 1)]
        dp[0][0] = True

        for i in range(2, len(p) + 1):
            dp[i][0] = dp[i - 2][0] and p[i - 1] == '*'

        for i in range(1, len(p) + 1):
            for j in range(1, len(s) + 1):
                if p[i - 1] == "*":
                    dp[i][j] = dp[i - 2][j] or dp[i - 1][j]
                    if p[i - 2] == s[j - 1] or p[i - 2] == '.':
                        dp[i][j] = dp[i][j] or dp[i][j - 1]
                else:
                    if p[i - 1] == s[j - 1] or p[i - 1] == '.':
                        dp[i][j] = dp[i - 1][j - 1]
        return dp[-1][-1]

```