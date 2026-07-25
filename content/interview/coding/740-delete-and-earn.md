---
slug: "740-delete-and-earn"
section: "coding"
title: "740. Delete and Earn"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1704431975
updated_at: 1709446459
published_at: 1704431975
---
[740\. Delete and Earn](https://leetcode.com/problems/delete-and-earn/)

這個題目從題目本身的敘述其實滿容易猜到解法是透過動態規劃求解，比較困難的是要找到符合動態規劃的子問題。

題目給的條件是如果選定一個數字 `k`，其中如果有 `n` 個 `k` 那就可以獲得 `k * n` 的獎勵，但是就不能選擇 `k - 1` 以及 `k + 1` 的數字。而目標是要最大化可以得到的獎勵。

動態規劃的題目，通常給的陣列中，每個元素都是獨立事件，但是這個題目卻不是，因為相同的數字 `k` 可以散落在這個陣列中的各處，也就是會需要來回在陣列中的各處去找到 `k` 並且剔除 `k` 前後的可能。

這就是這個題目比較困難的地方，首次解題時，我也想過了是不是可以用 `Heap` 來處理？還是要用回溯法來處理，但是都會卡在陣列中的數字是散落在各地的這個問題。

所以我還是仔細的觀察題目，題目給的第二個例子其實比較好幫助思考 `nums = [2,2,3,3,3,4]` 那就是如果陣列已經排列好的話，是不可以一次把一樣的數字選取起來？

```text
   [2, 2, 3, 3, 3, 4]
=> [4,    9,       4]
```

這時候這個題目就會比較容易想了！因為其實如果把數字 k 一起選起來，我們就知道可以跳過 k + 1 。

但是上面這樣的做法也會有問題，因為如果題目是 `[2, 2, 3, 3, 3, 5]` 選了 3 之後 5 還是可以繼續選的，但是沒問題，因此觀察到此，其實這個題目是很類似 [198\. House Robber](/interview/coding/198-house-robber) 的問題的，就是當選擇偷第 `k` 個位置時，前後兩個位置的房子是不能去碰的。

因此只要能把題目給的形式，轉換成 House Robber 的形式，就可以算出最大的獎勵了。

我的做法是，原先陣列中有出現的數字，都當作是 index ，並且在該 index 中把獎勵都累積起來，至於陣列要多大，其實只要找到最大的數字即可。

當有這些思路後解法就比較簡單了：

```python
class Solution:
    def deleteAndEarn(self, nums: List[int]) -> int:
        
        m = max(nums) + 1
        
        rewards = [0] * m
        
        for num in nums:
            rewards[num] += num
            
        res = [0] * (len(rewards) + 1)

        res[1] = rewards[0]

        i = 2
        while i < len(rewards) + 1:
            res[i] = max(rewards[i - 1] + res[i - 2], res[i - 1])
            i += 1
            
        return res[-1]
```