---
slug: "525-contiguous-array"
section: "coding"
title: "525. Contiguous Array"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1724038722
updated_at: 1761272526
published_at: 1724038722
---
[525\. Contiguous Array](https://leetcode.com/problems/contiguous-array/)

題目給定一個只包含 `0` 和 `1` 的陣列，請找出其中**最長的子陣列**，這個子陣列必須滿足**包含相同數量的 `0` 和 `1`**。

* * *

#### 暴力解法（不推薦）

可以用暴力法遍歷所有子陣列，然後統計 `0` 和 `1` 的個數來檢查是否相等。不過這種方法的時間複雜度為 $O(n^2)$，在陣列長度較大時效率太差。

* * *

#### 優化思路

這題其實是一個**經典的 prefix sum + hashmap 題型**，但不容易直接看出來，屬於那種「看過就秒懂、沒看過很難自己想到」的題目。

這題的第一個關鍵在於：  
👉 **將問題轉換為 prefix sum 的形式來解。**

因為我們想要找的是 `0` 和 `1` 數量相同的子陣列，我們可以把陣列中的 `0` 全部視為 `-1`，這樣就把問題轉換為：  
➡️「找到一段子陣列，總和為 `0`」。

* * *

#### 第二個關鍵點：怎麼有效率地找到總和為 0 的子陣列？

我們可以邊走邊累加 prefix sum（前綴總和），同時使用一個 `哈希表`（`dict`）來記錄每個前綴和第一次**出現的位置**。

為什麼這樣做？  
因為如果在 index `i` 和 `j`（`i < j`）都出現了相同的 prefix sum，代表從 `i+1` 到 `j` 之間的元素總和為 `0`，這樣就可以構成一個符合條件的子陣列。

* * *

#### 程式碼：

```python
class Solution:
    def findMaxLength(self, nums: List[int]) -> int:
        n = len(nums)
        # 建立前綴總和陣列
        preSum = [0] * (n + 1)
        for i in range(n):
            # 把 0 當作 -1，這樣總和為 0 表示 0 和 1 一樣多
            preSum[i + 1] = preSum[i] + (-1 if nums[i] == 0 else 1)
        
        # 用 dict 紀錄 prefix sum 最早出現的位置
        vToi = {}
        res = 0
        for i in range(n + 1):
            if preSum[i] not in vToi:
                vToi[preSum[i]] = i  # 第一次出現時記下 index
            else:
                # 找到之前有一樣的總和，計算長度
                res = max(res, i - vToi[preSum[i]])
        return res

```

> 「為何 prefix 長度不能用 `n` 就好？」

其實是關鍵點。  
我們來仔細看這行：

```python
preSum = [0] * (n + 1)
```

為什麼要多一格（`n + 1`）？  
因為這裡的 **prefix sum（前綴和）** 是「到目前為止的總和」，**而不是單純每個元素的值。**

* * *

### 🔍 直覺解釋

假設 `nums = [0, 1]`。

我們想找到 **0 和 1 一樣多的最長子陣列**。  
正確答案是長度 `2`（整個 `[0, 1]`）。

* * *

### 如果你只建長度 `n` 的前綴和：

```text
preSum = [0] * n
```

那你只能存：

```text
preSum[0] = nums[0] => -1
preSum[1] = preSum[0] + nums[1] => 0

```

→ 你沒辦法代表「從 index 0 開始前面**沒有任何元素**」的情況。

* * *

### 為什麼要多一格

用 `n + 1` 長度，並從 `preSum[0] = 0` 開始，就可以這樣對應：

i (index)

nums\[i-1\]

preSum\[i\]

含義

0

(無)

0

還沒開始，看作「空前綴」

1

nums\[0\]=0

\-1

前 1 個元素的和

2

nums\[1\]=1

0

前 2 個元素的和

這樣一來：

-   當你看到 `preSum[2] == preSum[0] == 0` 時，  
    表示從 index `0` 到 `1`（也就是整段 `[0,1]`）的和為 0，  
    所以這段有一樣多的 0 和 1，長度是 `2 - 0 = 2` ✅

* * *

### 🧠 如果不用多一格會怎樣？

你會錯過「從一開始就平衡」的子陣列。

例如：

```text
nums = [0, 1]
```

用 `preSum = [0, -1]`  
沒有地方能表示「從最開始到現在 sum 為 0」，  
因此找不到 `preSum[i] == preSum[j]` 的情況，結果會錯。

* * *

### ✅ 結論

`preSum` 要長度 `n + 1` 是為了：

1.  在開頭放一個 `0`（代表空前綴、索引前的位置）。
2.  讓每個 `preSum[i]` 對應「前 i 個元素」的總和。
3.  能正確計算從頭開始的平衡區間長度。

所以：

`preSum = [0] * (n + 1) # 正確   preSum = [0] * n # 錯，會漏掉從開頭開始的情況`  

* * *

### 時間與空間複雜度分析：

-   時間複雜度：$O(n)$，只遍歷了一次陣列。
-   空間複雜度：$O(n)$，用了一個 dict 存每個 prefix sum 出現的位置。

* * *

### 小總結

這題的精髓：

-   想到把 `0` 當作 `-1`，然後轉換成總和為 `0` 的問題。
-   用 prefix sum + hashmap 找到「子陣列總和為 0」的最長距離。