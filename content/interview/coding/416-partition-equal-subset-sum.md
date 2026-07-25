---
slug: "416-partition-equal-subset-sum"
section: "coding"
title: "416. Partition Equal Subset Sum"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674964893
updated_at: 1674965021
published_at: 1674964893
---
[416\. Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/)

首先我們要確立目標，目標是給定一個陣列能不能分成兩個子集合，讓這兩個子集合的總和相等。

第一個要去想的地方比較簡單，既然兩個子集合要相等，那一個子集合一定是原陣列總和的一半，我們的目標**就是要找到一個一個子集合，其總和是原陣列總和的一半**。

另外，有可能原陣列的元素總和是奇數：例如：`[1, 2, 1, 1]` 這樣的陣列總和是 5 ，一定不會有辦法分成兩個集合，所以可以先用這樣的方式去剪枝（把所有總和為奇數的直接排除掉）。

接著是要怎麼選擇，每一個元素我們都可以有「選」或是「不選」這兩種方式，如果**選**的話，我們的目標就會減少當下的數值，如果**不選**的話，目標並不會改變，一直到如果我們選了最後一個數字，**如果最後目標剛好等於 0 ，那就是我們透過選擇，找到了目標**。

這樣的關係可以用一個遞迴的方式來呈現。

## 遞迴

```python
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)        
        if total % 2 != 0:
            return False        
        def helper(i, target):
            if i == len(nums) - 1:
                return target == 0
            else:
                return helper(i + 1, target - nums[i]) or helper(i + 1, target)

        return helper(0, total//2)
```

既然遞迴的方式已經寫好了，上面這個函式很明顯的存在著重疊的子問題，例如最後一個位置的「選」或「不選」，在前面幾個元素在做選擇時，會一直重複的計算，因此可以用記憶法，來記憶著已經做過的選擇。而每個位置的選擇或不選擇，可以透過當前位置與目標來決定。

## 自頂向下

```python
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)        
        if total % 2 != 0:
            return False        
        memo = {}
        def helper(i, target):
            if (i, target) in memo:
                return memo[(i, target)]
            if i == len(nums) - 1:
                return target == 0
            else:
                memo[(i, target)] = helper(i + 1, target - nums[i]) or helper(i + 1, target)
                return memo[(i, target)]

        return helper(0, total//2)
```

## 自底向上

一直以來我都覺得自底向上比較難想到，這題也是不太好想。

原陣列的每個位置都會有選擇或是不選擇兩種，自底向上的想法是，如果我們知道第 `i` 的位置在選擇的時候，是不是可以達到某個比我們的目標還要小的數值。

文字敘述很抽象，換成一個數學的例子就是，現在最後的目標是 `5` ，前一個位置如果已經可以達到目標 5 了，那我這個位置就不用選擇，如果我的當前值是 `2` ，那在前一個位置如果可以達到 `5 - 2 = 3` ，那我就要選擇當前位置的元素，這一串選擇就是 L20 在做的事情。

一開始的 base case 則是如果說一開始的目標就是 0 ，那不管有沒有選都是符合條件了。

```python
class Solution:
    def canPartition(self, nums: List[int]) -> bool:

        total = sum(nums)
        if total % 2 != 0:
            return False

        M = len(nums)
        N = total // 2
        dp = [[False] * (N + 1) for _ in range(M+1)]

        for i in range(M+1):
            dp[i][0] = True


        for i in range(1, M+1):
            for j in range(1, N+1):
                if j - nums[i - 1] < 0:
                    dp[i][j] = dp[i - 1][j]
                else:
                    dp[i][j] = dp[i - 1][j] or dp[i - 1][j - nums[i-1]]

        return dp[M][N]
```