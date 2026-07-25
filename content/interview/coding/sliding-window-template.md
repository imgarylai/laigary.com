---
slug: "sliding-window-template"
section: "coding"
title: "Sliding Window 模板"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
滑動窗口的骨架永遠是「右指針擴張、左指針收縮」，變的只有**窗口要維護什麼條件**：

```python
def sliding_window(s):
    window = {}                      # 窗口內的統計（次數、總和…）
    left = 0
    ans = 0
    for right in range(len(s)):
        # 1. 右邊界進入窗口
        window[s[right]] = window.get(s[right], 0) + 1

        # 2. 條件被破壞 → 收縮左邊界
        while 條件不合法:
            window[s[left]] -= 1
            left += 1

        # 3. 此時窗口合法，更新答案
        ans = max(ans, right - left + 1)
    return ans
```

動手前先講清楚兩件事：**窗口的合法條件是什麼**（不重複？至多 k 種？和 ≥ target？）、**答案在收縮前算還是收縮後算**。

## 兩種變形

### 求最長：收縮到合法為止，收縮後更新答案

`while 不合法: 收縮`，跳出迴圈時窗口一定合法，這時取 `max`。

例題：[3. Longest Substring Without Repeating Characters](/interview/coding/3-longest-substring-without-repeating-characters)、[424. Longest Repeating Character Replacement](/interview/coding/424-longest-repeating-character-replacement)、[1004. Max Consecutive Ones III](/interview/coding/1004-max-consecutive-ones-iii)

### 求最短：收縮的每一步都是候選答案

`while 合法: 先更新 min，再收縮` — 因為越縮越短，每一步都可能是更好的答案。

```python
        while 窗口已經合法:
            ans = min(ans, right - left + 1)
            window[s[left]] -= 1
            left += 1
```

例題：[76. Minimum Window Substring](/interview/coding/76-minimum-window-substring)、[209. Minimum Size Subarray Sum](/interview/coding/209-minimum-size-subarray-sum)

## 固定長度窗口

窗口大小固定時不需要 `while`，右邊進來、左邊就直接出去：

```python
    for right in range(len(nums)):
        total += nums[right]
        if right >= k:
            total -= nums[right - k]     # 超過 k 個就吐掉最左邊
        if right >= k - 1:
            ans = max(ans, total)
```

例題：[567. Permutation in String](/interview/coding/567-permutation-in-string)、[438. Find All Anagrams in a String](/interview/coding/438-find-all-anagrams-in-a-string)

## 用計數器判斷「湊齊了沒」

比對字元次數時，不要每次都掃整個 dict — 維護一個 `formed` 計數，只在某個字元的次數**剛好達標**時 +1：

```python
        if window[c] == need[c]:
            formed += 1
        # formed == len(need) 就代表湊齊
```

這是 Minimum Window Substring 從 $O(n \cdot k)$ 降到 $O(n)$ 的關鍵。

## 什麼時候不能用滑動窗口

窗口能收縮的前提是**單調性**：擴張只會讓條件更容易/更難滿足，不會反覆橫跳。陣列有負數的「和 ≥ target」就不能用滑動窗口（縮短不保證和變小），要改用前綴和 + 單調佇列。

其他例題：[159. Longest Substring with At Most Two Distinct Characters](/interview/coding/159-longest-substring-with-at-most-two-distinct-characters)、[239. Sliding Window Maximum](/interview/coding/239-sliding-window-maximum)

更多題目 → [#Sliding Window](/interview/coding?tag=Sliding%20Window)
