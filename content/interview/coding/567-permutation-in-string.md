---
slug: "567-permutation-in-string"
section: "coding"
title: "567. Permutation in String"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972893
updated_at: 1709523170
published_at: 1674972893
---
[567\. Permutation in String](https://leetcode.com/problems/permutation-in-string/)

1.  我們需要想的是窗口增大的時候，需要更新哪些資訊？
2.  如果 char 在目標內，增加計數
3.  如果 char 的計數已經達到目標的計數，**valid 加一**
4.  何時要收縮窗口？
5.  如果窗口的字串的長度已經大於目標的字串（因為我們要找的是 permutation)
6.  收縮窗口時，需要更新哪些資訊？
7.  檢查左邊的指針的字元在目標內
8.  如果 char 的計數已經達到目標的計數，**valid 減一**
9.  如果 char 在目標內，減少
10.  最終結果要在「擴大窗口」時更新還是「收縮窗口」時更新？
11.  如果 valid 剛好和 target 的長度一樣的時候，代表找到 permutation 了，回傳 True

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        target = Counter(list(s1))
        visited = defaultdict(int)
        left = 0
        right = 0
        valid = 0
        while right < len(s2):
            char = s2[right]
            right += 1
            if char in target:
                visited[char] += 1
                if visited[char] == target[char]:
                    valid += 1
            while right - left >= len(s1):
                if valid == len(target):
                    return True
                char = s2[left]
                left += 1
                if char in target:
                    if visited[char] == target[char]:
                        valid -= 1
                    visited[char] -= 1
        return False

```