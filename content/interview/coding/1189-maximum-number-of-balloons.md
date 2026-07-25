---
slug: "1189-maximum-number-of-balloons"
section: "coding"
title: "1189. Maximum Number of Balloons"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743744732
updated_at: 1761256209
published_at: 1743744732
---
[1189\. Maximum Number of Balloons](https://leetcode.com/problems/maximum-number-of-balloons/)

這個題目其實很容易看得出來是用 [Hash Table](/interview/coding?tag=Hash%20Table) 來做，不過有一個小地方是要怎麼處理 `balloon` 這個單字，這個單字的 `l` 和 `o` 是重複的。

不過主要的邏輯是這樣的，一開始一定是先計算出 `text` 每個字元出現的頻率，如果給定的 `text` 有 `10` 個 `b` 跟 `2` 個 `l` ，雖然我們還不知道其他的字元出現的情況，其實已經可以判斷出來我們已經有一個 bottle neck 在 `l` 身上。

接著我們要看可以擠出幾個 `balloon` ，這裡我們也需要把 `balloon` 做一個轉換，那就是計算出組合出這個 `target` 每個字元各需要幾個？

至次，我們就可以開始去看，給定的文字裡面，如果出現 `l` 五次，每組合出一個 `balloon` 需要用掉兩個，因此我們得到

```text
b -> 5 // 2
```

接著找出剩餘 `a, l, o, n` 各自可以組合出幾個，我們只要找出最小值就好了。

```python
class Solution:
    def maxNumberOfBalloons(self, text: str) -> int:
        
        target = "balloon"
        
        dest = Counter(target)
        src = Counter(text)
        
        d = defaultdict(int)
        
        for key, val in dest.items():
            if key not in dest:
                return 0
            d[key] += src[key] // val
        
        return min(d.values())
```