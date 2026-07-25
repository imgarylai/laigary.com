---
slug: "438-find-all-anagrams-in-a-string"
section: "coding"
title: "438. Find All Anagrams in a String"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1674972895
published_at: 1674972895
---
[483\. Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

1.  我們需要想的是窗口增大的時候，需要更新哪些資訊？
2.  如果 char 在目標內，增加計數
3.  如果 char 的計數已經達到目標的計數，**valid 加一**
4.  何時要收縮窗口？
5.  如果窗口的字串的長度已經大於目標的字串（因為我們要找的是 permutation)
6.  收縮窗口時，需要更新哪些資訊？
7.  檢查左邊的指針的字元在目標內
8.  如果 char 的計數已經達到目標的計數，**valid 減一**
9.  如果 char 在目標內，減少計數
10.  最終結果要在「擴大窗口」時更新還是「收縮窗口」時更新？
11.  如果 valid 剛好和 target 的長度一樣的時候，代表找到 anagram 了，將左側的指針存入到答案內。

```python
class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        target = Counter(list(p))
        visited = {}
        left = 0
        right = 0
        valid = 0
        ans = []
        while right < len(s):
            c = s[right]
            right += 1
            if c in target:
                visited[c] = visited.get(c, 0) + 1
                if visited[c] == target[c]:
                    valid += 1
            while right - left >= len(p):
                if valid == len(target):
                    ans.append(left)
                c = s[left]
                left += 1
                if c in target:
                    if visited[c] == target[c]:
                        valid -= 1
                    visited[c] -= 1
        return ans

```