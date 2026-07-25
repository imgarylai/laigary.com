---
slug: "1358-number-of-substrings-containing-all-three-characters"
section: "coding"
title: "1358. Number of Substrings Containing All Three Characters"
status: "published"
pinned: false
tags: ["Sliding Window", "Two Pointers"]
created_at: 1674972892
updated_at: 1764828906
published_at: 1674972892
---
[1358\. Number of Substrings Containing All Three Characters](https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/)

這個題目是一個很標準的 [Sliding Window](/interview/coding?tag=Sliding%20Window) 的問題，增加/減少 Window 的條件並不難，如下：

```python
class Solution:
    def numberOfSubstrings(self, s: str) -> int:
        counter = defaultdict(int)

        counter['a'] = 0
        counter['b'] = 0
        counter['c'] = 0

        slow = 0
        fast = 0
        res = 0
        while fast < len(s):
            c = s[fast]
            counter[c] += 1
            while counter['a'] > 0 and counter['b'] > 0 and counter['c'] > 0 and slow <= fast:
                res += len(s) - fast
                c = s[slow]
                counter[c] -= 1
                slow += 1
            fast += 1
        
        return res
```

1.  當 a, b, c 不足時，持續增大窗口。
2.  當 a, b, c 足夠時，開始減少窗口。

最困難的地方是要計算總共有幾個 substring: `res += len(s) - fast` 這一行。

當在裡面的 `while` 迴圈時，我們可以確定

1.  `[slow, fast]` 滿足我們的條件
    1.  `[slow, fast + 1]` 也一定滿足我們的條件
    2.  ...
    3.  `[slow, fast + n ]` 也一定滿足我們的條件
    4.  `n` 的值就是 `len(s) - 1`

要計算總共的個數，就會變成

$$
(\text{len}(\text{s}) - 1) - \text{fast} + 1 = \text{len}(\text{s}) - \text{fast}
$$

我們用最後一個索引，減去當前 `fast` 的索引，最後要把 `fast` 這個個數加回來，這樣當前窗口就計算完成了。

而當收縮窗口後也滿足條件，就會變成這樣：

1.  `[slow - 1, fast]` 滿足我們的條件
    1.  `[slow - 1, fast + 1]` 也一定滿足我們的條件
    2.  ...
    3.  `[slow - 1, fast + n ]` 也一定滿足我們的條件
    4.  `n` 的值就是 `len(s) - 1`

要計算總共的個數，就會變成

$$
(\text{len}(\text{s}) - 1) - \text{fast} + 1 = \text{len}(\text{s}) - \text{fast}
$$

## 時間複雜度分析

雖然程式有兩個迴圈，但是只是在處理展開跟收縮窗口而已，時間複雜度依然是線性的 $O(n)$。