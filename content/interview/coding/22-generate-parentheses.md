---
slug: "22-generate-parentheses"
section: "coding"
title: "22. Generate Parentheses"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844917
updated_at: 1761887096
published_at: 1674844917
---
[22\. Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)

這一題和 [46\. Permutations](/interview/coding/46-permutations) 很類似，題目要求的就是要窮舉。

最好寫回溯法的題目通常都會符合人類的直覺，因為括號的特性是左邊括號跟右邊括號一定是成雙成對的出現，因此這一個題目就會以不斷地先把所有的左邊括號列舉完，再列舉右邊括號，之後再退回一個左邊括號後，再往下繼續拼湊，例如，我們要產生 3 對括號，順序如下：

```text
1. ((()))
2. (()())
3. (())()
4. ()(())
5. ()()()
```

這一題的終止條件就是當左側括號的使用數量等於右側括號的使用數量時，就是產生出一組可行解了，就可以將其記錄到答案中。

另外如何判斷這次要走左側括號還是右側括號，邏輯是一定要先使用左側括號，只要左側括號的使用數量少於題目的要求，就先往左側，接著再判斷右側括號的使用數量，如果還可以使用右側括號，就繼續使用，一直到左右側括號的使用數量都遇見終止條件為止。

```python
class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        ans = []
        def backtrack(curr = [], left = 0, right = 0):
            if left == n and right == n:
                ans.append(''.join(curr))
                return
            if left < n: # left can not exceeds n
                curr.append('(')
                backtrack(curr, left + 1, right)
                curr.pop()
            if right < left: # right can not exceeds left
                curr.append(')')
                backtrack(curr, left, right + 1)
                curr.pop()

        backtrack()
        return ans
```

時間複雜度是 $O(n)$ 。