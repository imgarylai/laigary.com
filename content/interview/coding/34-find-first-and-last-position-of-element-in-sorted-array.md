---
slug: "34-find-first-and-last-position-of-element-in-sorted-array"
section: "coding"
title: "34. Find First and Last Position of Element in Sorted Array"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943893
updated_at: 1784933465
published_at: 1674943893
---
[34. Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

後面我放入第一次寫的時候的筆記，這一個題目算是對於二分搜索的集大成，最困難的兩個點就是：

1. 要找左、右邊界
2. 目標可以不存在

我第一次寫的時候，就是依照 [704. Binary Search](/interview/coding/704-binary-search) 的方式去摸索出答案，我用的是閉區間的方法，因為我其實都是用閉區間的方式在處理二分搜索，這樣我的心智模型比較簡單。

以左邊界為例，每次搜索的值如果剛好和目標一樣大，或是更大的時候，那 mid 就會可能是我們要找的左邊界，但是我們不能找到 target 就停下來，所以要額外記得左邊界的值。

由於題目並不保證值一定存在，所以最後拿到的指針，要去看這個位置的值是不是跟 Target 相同才可以，所以我寫出的邏輯如下：

```py
low, high = 0, len(nums) - 1
left_boundary = -1 # 預設找不到
right_boundary = -1

while low <= high:
    mid = low + (high - low) // 2
    
    # 關鍵判斷：當 nums[mid] >= target 時，mid 可能是答案，或答案在更左邊
    if nums[mid] >= target:
        left_boundary = mid   # 暫存這個潛在答案
        high = mid - 1        # 繼續向左邊區間探索
    else: # nums[mid] < target
        low = mid + 1         # 答案一定在右邊區間

left_boundary = -1 if left_boundary != -1 and target != nums[left_boundary] else left_boundary
```

這裡可以進一步優化成：

我們其實可以改成直接去找左邊界在哪裡，唯一要擔心的是，target 比所有的值都大，左邊界會一路跳出區間 (left = right + 1)。

```py
def lower_bound(target):
    # 找第一個 >= target 的索引,閉區間 [low, high]
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] >= target:
            high = mid - 1      # mid 可能是答案,但要往左找更早的
        else:
            low = mid + 1
    return low                  # 結束時 low 停在第一個 >= target 的位置

left = lower_bound(target)

if left == len(nums) or nums[left] != target: # 越界，或是根本沒有目標值。
    return [-1, -1]
```

以上把邏輯稍微更新一下，就可變成查找右邊界，還有你可能會問，為什麼要有 target 這個變數？

這是我後面進一步學習到的另一個想法是如果我們可以找到左邊界，其實我們也可以很快速的找到右邊界，只要我找的左邊界目標是 target + 1 ，那他的前一個位置，就一定是 target 的右邊界。

```py
class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        low, high = 0, len(nums) - 1
        right_boundary = -1

        def lower_bound(target):
            # 找第一個 >= target 的索引,閉區間 [low, high]
            low, high = 0, len(nums) - 1
            while low <= high:
                mid = low + (high - low) // 2
                if nums[mid] >= target:
                    high = mid - 1      # mid 可能是答案,但要往左找更早的
                else:
                    low = mid + 1
            return low                  # 結束時 low 停在第一個 >= target 的位置

        left = lower_bound(target)

        if left == len(nums) or nums[left] != target:
            return [-1, -1]
        
        right = lower_bound(target + 1)
        return [left, right - 1]
```

---

這一題是一個非常好的二分搜索的尋找左邊界與右邊界的問題。

題目給定的是一個排序好的陣列，陣列內的元素會有重複，以及一個數值，目標就是要看這個陣列是否存在這個值，並且因為元素會有重複，題目所要求的是回傳這個數值最左邊的位置以及最右邊的位置。

這個題目存在著夠快的線性時間 $O(n)$ 的解法，當然這並不是最佳的解法，通常可以想到可以用二分搜索的方式來搜尋，不過需要注意的是陣列存在著重複的元素，要怎麼處理？

首先先處理左邊界的情況：

1. 當找到某個位置，其值剛好等於目標時，再檢查三件事情
  1. 該位置是不是剛好是最左邊界的位置？如果是的話代表最目前的左邊界就是目標數值的最左邊界。
  2. 該位置不是在最左邊界：
    1. 前一個位置的值比自己小，這樣也代表現在這個位置是最左邊界。（因為還沒有碰到最左邊界，所以不用擔心指針的位置超過陣列的範圍）
    2. 前一個位置的值剛好等於自己，代表左邊還有數值跟目標依樣，此時右邊界往左縮一格。
2. 如果該位置的數值比目標大，代表要往左側搜尋，移動右邊界到目前位置的前一個位置。
3. 如果該位置的數值比目標小，代表要往右側搜尋，移動左邊界到目前位置的下一個位置。
4. 繼續搜尋

以上反之即為尋找右邊界的邏輯。

```python
class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        low, high = 0, len(nums) - 1
        left_boundary = -1 # 預設找不到
        right_boundary = -1

        while low <= high:
            mid = low + (high - low) // 2
            
            # 關鍵判斷：當 nums[mid] >= target 時，mid 可能是答案，或答案在更左邊
            if nums[mid] >= target:
                left_boundary = mid   # 暫存這個潛在答案
                high = mid - 1        # 繼續向左邊區間探索
            else: # nums[mid] < target
                low = mid + 1         # 答案一定在右邊區間

        left_boundary = -1 if left_boundary != -1 and target != nums[left_boundary] else left_boundary

        low, high = 0, len(nums) - 1
        while low <= high:
            mid = low + (high - low) // 2
            
            # 關鍵判斷：當 nums[mid] >= target 時，mid 可能是答案，或答案在更左邊
            if nums[mid] <= target:
                right_boundary = mid   # 暫存這個潛在答案
                low = mid + 1          # 繼續向右邊區間探索
            else: # nums[mid] > target
                high = mid - 1         # 答案一定在左邊區間
        
        right_boundary = -1 if right_boundary != -1 and target != nums[right_boundary] else right_boundary

        return [left_boundary, right_boundary]

```

