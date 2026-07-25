---
slug: "424-longest-repeating-character-replacement"
section: "coding"
title: "424. Longest Repeating Character Replacement"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1784611910
published_at: 1674972894
---
[424. Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/)

這個題目是滑動窗口的問題，要怎麼去想到收縮窗口是比較困難的。

這個條件的核心在於判斷「**當前視窗的大小」是否超過了「可替換字元的上限」**。

我們可以將公式重新整理一下，會更直觀：

$(fast - slow) - max_count > k$

### 邏輯拆解：

1. **$(fast - slow)$**：代表當前滑動視窗（Sliding Window）的**總長度**。
2. **$max_count$**：代表目前視窗中**出現次數最多的字元**數量。我們通常會選擇保留這個字元，因為這樣需要替換的次數最少。
3. **$(fast - slow) - max_count$**：這就代表了「**視窗內除了出現次數最多的字元以外，剩下的所有字元數量」。也就是我們必須透過 $k$ 次替換才能讓整個視窗變成相同字元**的成本。

```python
class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        slow = 0
        fast = 0
        table = defaultdict(int)
        max_count = 0
        res = 0
        while fast < len(s):
            char = s[fast]
            table[char] += 1
            fast += 1
            max_count = max(max_count, table[char]) # 找出目前出現最多次的字元
            if (fast - slow) - max_count > k: # 當前字串長度減去目前出現最多次的字元，相當於需要替換的字元最少，如果這樣的情況還是大於 k ，我們需要縮緊窗口。
                char = s[slow]
                table[char] -= 1
                slow += 1
            res = max(res, fast - slow)
        return res
```