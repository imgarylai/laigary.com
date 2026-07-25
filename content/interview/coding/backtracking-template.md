---
slug: "backtracking-template"
section: "coding"
title: "Backtracking 模板"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1784873573
updated_at: 1784873573
published_at: 1784873573
---
Backtracking 的本質是「窮舉一棵決策樹」，模板永遠是同一套：

1. **做選擇** — 把當前選項加進路徑
2. **遞迴** — 帶著新狀態往下走
3. **撤銷選擇** — 回到上一步，換下一個選項

```python
def backtrack(路徑, 選項):
    if 滿足結束條件:
        結果.append(路徑[:])  # 注意要複製
        return
    for 選 in 選項:
        路徑.append(選)      # 做選擇
        backtrack(路徑, 新的選項)
        路徑.pop()           # 撤銷選擇
```

真正會考的差異只有三個：**選項怎麼縮小、要不要去重、怎麼剪枝**。

## 三種基本型

### Subsets 型：用 start 控制「只能往後選」

每個節點都是答案，用 `start` 避免回頭產生重複組合。

```python
def backtrack(start, path):
    res.append(path[:])              # 每個節點都收
    for i in range(start, len(nums)):
        path.append(nums[i])
        backtrack(i + 1, path)       # i + 1：不回頭
        path.pop()
```

例題：[78. Subsets](/interview/coding/78-subsets)、[77. Combinations](/interview/coding/77-combinations)

### Combination Sum 型：可以重複選自己

跟 Subsets 唯一的差別是遞迴時傳 `i` 而不是 `i + 1`。

```python
        backtrack(i, path)           # i：同一個元素可以再選
```

例題：[39. Combination Sum](/interview/coding/39-combination-sum)

### Permutations 型：用 used 記錄「誰被選過」

順序有意義，所以每層都從頭掃，用 `used` 排除已在路徑上的元素。

```python
def backtrack(path):
    if len(path) == len(nums):
        res.append(path[:])
        return
    for i in range(len(nums)):
        if used[i]:
            continue
        used[i] = True
        path.append(nums[i])
        backtrack(path)
        path.pop()
        used[i] = False
```

例題：[46. Permutations](/interview/coding/46-permutations)

## 去重：排序 + 同層跳過

輸入有重複元素時，先排序，然後**同一層**遇到跟前一個一樣的元素直接跳過（前一個沒被用，代表這是同層的重複分支）：

```python
nums.sort()
for i in range(start, len(nums)):
    if i > start and nums[i] == nums[i - 1]:  # 同層去重
        continue
```

例題：[90. Subsets II](/interview/coding/90-subsets-ii)、[40. Combination Sum II](/interview/coding/40-combination-sum-ii)

## 剪枝

在 `for` 迴圈裡提前 `break` / `continue` 掉不可能的分支，是唯一能救時間複雜度的手段：

- 剩餘的和已經超過 target → `break`（排序後可以直接斷整層）
- 剩下的元素不夠湊滿 k 個 → 縮小 `range` 上界
- 位置不合法（如 N Queens 的斜線衝突）→ `continue`

例題：[22. Generate Parentheses](/interview/coding/22-generate-parentheses)、[131. Palindrome Partitioning](/interview/coding/131-palindrome-partitioning)、[79. Word Search](/interview/coding/79-word-search)、[51. & 52. N Queens](/interview/coding/51-52-n-queens)

## 面試時的講法

先講「這是窮舉問題，我用 backtracking」，畫出決策樹的前兩層，指出：分支怎麼縮小（start / used）、哪裡收答案（葉子還是每個節點）、哪裡可以剪枝。講完這三點再動手，code 幾乎是照模板填空。

更多題目 → [#Backtrack](/interview/coding?tag=Backtrack)
