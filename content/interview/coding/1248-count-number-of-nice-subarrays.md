---
slug: "1248-count-number-of-nice-subarrays"
section: "coding"
title: "1248. Count Number of Nice Subarrays"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1742787806
published_at: 1674972895
---
[1248\. Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/)

這題目要求我們找到數組中 **總和為 `k` 的奇數數目** 的子陣列數量。每當我們遍歷到一個數字，我們會檢查「當前奇數的個數」和「之前出現過的奇數個數」之間的差值是否等於 `k`，如果是，則表示這部分的子陣列符合條件。

1.  **`counts` 是一個哈希表，用來存儲「奇數數量」的累積頻率**
    -   這個 `counts` 哈希表的目的是記錄每個「奇數數量」出現的次數。它的 key 是「當前奇數的個數」，value 是該個數出現過多少次。
    -   **初始化 `counts[0] = 1`** 是為了處理一些特殊情況，詳情稍後會解釋。
2.  **`curr` 是當前遍歷到的位置所遇到的奇數數量**
    -   `curr` 變數用來跟蹤當前子陣列中奇數的個數。
    -   每遇到一個奇數（即 `num % 2 == 1`），`curr` 就增加 1；如果是偶數（`num % 2 == 0`），`curr` 不變。
3.  **`ans` 用來累積結果：符合條件的子陣列數量**
    -   `ans` 是用來儲存符合條件的子陣列數量的變數。
4.  **`for num in nums:` 迴圈遍歷整個數組**
    -   這是遍歷每個數字的核心部分。在每次迴圈中，我們會更新當前的 `curr`（奇數數量）並根據 `counts` 查找是否存在合適的子陣列。
5.  **`curr += num % 2`**
    -   這行代碼將當前數字 `num` 是否是奇數加到 `curr` 上。如果是奇數，`curr` 增加 1；如果是偶數，`curr` 不變。
6.  **`ans += counts[curr - k]`**
    -   這行的目的是累計符合條件的子陣列數量。
    -   `curr - k` 代表的是「之前出現過的 `curr - k` 奇數的數量」。
    -   例如，當前子陣列的奇數數量是 `curr`，而我們希望找到的是有 `k` 個奇數的子陣列，所以我們需要找到 `counts[curr - k]`（即前面出現過的、使得當前子陣列加上它後正好有 `k` 個奇數的子陣列）。
    -   如果 `counts[curr - k]` 存在，那就意味著存在一個以當前元素結束的子陣列，這個子陣列的奇數數量為 `k`，因此可以將 `counts[curr - k]` 加到 `ans` 上。
7.  **`counts[curr] += 1`**
    -   這行代碼更新 `counts` 哈希表中 `curr`（奇數的累積數量）的出現次數。當我們遍歷完一個元素後，`curr` 的值應該增加一次，表示這個奇數數量已經出現過一次。
8.  **`return ans`**
    -   最後返回 `ans`，即總共找到的符合條件的子陣列數量。

### **為什麼要設置 `counts[0] = 1`？**

當 `curr` 等於 `k` 時，意味著從陣列的開頭到當前位置的子陣列中，包含的奇數個數恰好為 `k`。這種情況需要被正確計算到，因此我們需要初始化 `counts[0] = 1`，這樣可以確保當 `curr - k` 等於 0 時，表示我們找到了一個子陣列，它的奇數數量恰好是 `k`，從開頭開始。

```python
class Solution:
    def numberOfSubarrays(self, nums: List[int], k: int) -> int:
        counts = defaultdict(int)
        counts[0] = 1
        ans = 0
        curr = 0

        for num in nums:
            curr += num % 2
            ans += counts[curr - k]
            counts[curr] += 1
        
        return ans
```

### **滑動窗口解法的思路：**

1.  **維護一個窗口**，這個窗口包含一定範圍內的元素。
2.  **兩個指標**（`left` 和 `right`）來定義窗口的範圍，`left` 是窗口的左邊界，`right` 是窗口的右邊界。
3.  當前窗口內有 `k` 個奇數的情況下，增加計數。
4.  當窗口內的奇數數量超過 `k` 時，將 `left` 右移來縮小窗口，直到窗口內的奇數數量不再超過 `k`。

### **解法細節：**

1.  當窗口內的奇數數量為 `k` 時，我們就可以計算出符合條件的子陣列。
2.  如果有更多奇數，我們調整左邊界 `left` 來減少窗口內的奇數數量。
3.  我們要確保窗口內的奇數數量不會多於 `k`，而且每次找到符合條件的子陣列時，我們都要加到答案中。

```python
class Solution:
    def numberOfSubarrays(self, nums: List[int], k: int) -> int:
        def at_most_k(k):
            count = 0
            left = 0
            odd_count = 0
            for right in range(len(nums)):
                # 若當前數字是奇數，增加奇數的計數
                if nums[right] % 2 == 1:
                    odd_count += 1
                
                # 當窗口中的奇數數量大於 k，移動左指標縮小窗口
                while odd_count > k:
                    if nums[left] % 2 == 1:
                        odd_count -= 1
                    left += 1

                # 當奇數數量小於或等於 k 時，所有[左指標...右指標]之間的子陣列都可以被視為有效
                count += right - left + 1
            return count
        
        # 我們可以先計算出「有 at most k 個奇數的子陣列數量」，然後再減去「有 at most (k-1) 個奇數的子陣列數量」
        return at_most_k(k) - at_most_k(k - 1)

```

### **解釋：**

1.  **`at_most_k(k)` 函數：** 這個輔助函數用來計算數組中包含 **最多 `k` 個奇數** 的子陣列數量。
    -   我們通過滑動窗口來調整左右指標，確保窗口內的奇數數量不超過 `k`。
    -   每次窗口的右邊界擴展時，若奇數數量符合條件，則窗口內的所有子陣列都滿足要求，因此我們將 `(right - left + 1)` 加到計數中。
2.  **`return at_most_k(k) - at_most_k(k - 1)`：**
    -   最後，我們利用這個公式來計算剛好包含 `k` 個奇數的子陣列數量。
    -   `at_most_k(k)` 計算的是包含 **最多 `k` 個奇數** 的子陣列數量，而 `at_most_k(k - 1)` 計算的是包含 **最多 `k-1` 個奇數** 的子陣列數量。兩者之差就會給出 **恰好包含 `k` 個奇數** 的子陣列數量。

### **為什麼使用滑動窗口？**

滑動窗口的優勢在於它可以有效地遍歷數組，而不需要每次都重複計算子陣列的奇數數量。這樣可以將時間複雜度從暴力解法的 $O(n^2)$ 降低到 $O(n)$，大大提高效率。

### **時間複雜度：**

-   `at_most_k(k)` 函數的時間複雜度是 $O(n)$，因為我們只遍歷數組一次，`left` 和 `right` 兩個指標最多會遍歷數組一次。
-   因此，總的時間複雜度是 $O(n)$，其中 `n` 是數組的長度。