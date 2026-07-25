---
slug: "2-sum-in-interview"
section: "coding"
title: "2 Sum 面試應對策略"
status: "published"
pinned: false
tags: []
created_at: 1765674248
updated_at: 1765695605
published_at: 1765674248
---
Two sum 是 LeetCode 最經典的題目，其衍伸題型也變成面試高頻題目之一，是個人人都會，但是每次準備面試的時候，總是會有一點小地方會忘記，這一篇是想要系統系的一次把所有的點都走過幫助自己記憶，因此這一篇的前置條件是先做過所有相關的題目。

首先是 [1\. 2 Sum](/interview/coding/1-2-sum) 的練習 2 sum 要求的是找出哪兩個「位置」的數值相加等於目標，因此位置很重要，在 `n` Sum 的題目裡面，通常找出的是哪 `n` 個值相加可以等於目標，因此位置相對不重要。

所以是回傳「位置」或是回傳「數值」這個條件其實在面試的時候很重要，因為 `n` Sum 其實最後會分解成更小的子問題透過 2 sum 來解，但是在面試時，面試官很有可能會先問 2 sum 再展開到 3 sum... to `n` sum ，因此在確認問題的條件的時候，可以先釐清我們只要回傳元素還是要回傳位置，兩者會有顯著的差異。

再來是基礎的 2 sum 題目，其題目有說並不會出現重複的值，因為如果有重複的值，答案就會變成多種「位置」都可以正確，但是在此情況時，2 sum 的數值都不會重複。

可是進階的 `n` sum 題目，題目中是可能出現重複的數值的，但是題目的要求是，我們可以有重複的數值，但是最後的答案我們並不要重複。例如：給定的陣列是 `[0, 0, 0, 0]` ，如果以 3 sum 來說，答案可以是位置 `0, 1, 2` 的 `[0, 0, 0]` 及位置 `1, 2, 3` 的 `[0, 0, 0]` ，由於答案一樣，但是我們只要選一組就好，這點我們後面會再談到。

理想的情況是面試時先從 2 sum 出發，並且題目只要回傳數值就好，這時候我們比較好建構在面試後續過程中，可以展開的解法，那就是透過雙指針的方式來解題。

```python
class Solution:
    def twoSum(self, nums, target):
        nums.sort()
        n = len(nums)
        res = []
        low = 0
        high = n - 1
        while low < high:
            total = nums[low] + nums[high]
            if total == target:
                return res.append([nums[low], nums[high])
            elif total < target:
                low += 1
            else:
                high -= 1
        return []
```

但是上述的方法還不能夠處理重複元素的問題，我們要如何解決呢？那就是當我們找到目標的時候，我們已經知道這兩個數字已經被選取了，這時候一樣的數字我們就要跳過。

```python
class Solution:
    def twoSum(self, nums, target):
        nums.sort()
        n = len(nums)
        low = 0
        high = n - 1
        res = []
        while low < high:
            left = nums[low]
            right = nums[high]
            total = nums[low] + nums[high]
            if total == target:
                res.append(nums[low], nums[high])
                while low < high and left == nums[low]:
                    low += 1 
                while low < high and right == nums[high]:
                    high -= 1
            elif total < target:
                low += 1
            else:
                high -= 1
        return res
```

上面的這個結構就可以完成上述的幾個 2 sum 條件了，並且他不只是找到一組解（原先 LeetCode 的題目只存在著一個解）。

接著我們就可以來前進到 3 sum 了，這時候我們把題目的目標也泛化，題目本來只有要求目標總和為 `0` 但是其實我們可以完成各種目標總和。

接著要來思考 3 sum 了，上面 2 sum 的做法雖然是透過雙指針，但是到更多的 `n` sum 時，這時候就要換成另一個 2 sum 的做法來思考，2 sum 的另一個思考模式是透過 [Hash Table](/interview/coding?tag=Hash%20Table) 來實作，但是我們並沒有要透過 Hash table 實作，只是理解他的想法，那就是如果我們今天有一個值 `x` 那我們就是要在剩下的陣列中，找出 2 sum 的 target 是 `target - x` 的所有組合。

如果是 4 sum ，也就是先找出 `target - x` 的 3 sum ，然後 3 sum 又可以重複上面的邏輯。

```python
class Solution:
    def twoSum(self, nums, start, target):
        n = len(nums)
        low = start
        high = n - 1
        res = []
        while low < high:
            left = nums[low]
            right = nums[high]
            total = nums[low] + nums[high]
            if total == target:
                res.append([nums[low], nums[high]])
                while low < high and left == nums[low]:
                    low += 1 
                while low < high and right == nums[high]:
                    high -= 1
            elif total < target:
                low += 1
            else:
                high -= 1
        return res

    def nSum(self, nums, n, start, target):
        k = len(nums)
        res = []
        if n < 2 or k < n:
            return []
        if n == 2:
            return self.twoSum(nums, start, target)
        else:
            for i in range(start, k):
                if i > start and nums[i] == nums[i - 1]:
                    continue
                else:
                    subs = self.nSum(nums, n - 1, i + 1, target - nums[i])
                    for sub in subs:
                        sub.append(nums[i])
                        res.append(sub)
        return res
                    

    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        return self.nSum(nums, 3, 0, 0)
```