---
slug: "1-2-sum"
section: "coding"
title: "1. 2 Sum"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973114
updated_at: 1699157402
published_at: 1674973114
---
1.  [2 Sum](https://leetcode.com/problems/two-sum/)

Two sum 最簡單的就是用窮舉法把所有的組合都列出來，時間複雜度為 $O(n^2)$ ，而且一直到 n Sum 都可以使用這樣的方式來做。當然就是時間複雜度太高了。

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i+1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return [-1, -1]

```

如果題目的陣列是有序排列的陣列，也可以使用雙指針來找到。這個方法很重要是因為在未來要拓展到 n Sum 時，我們需要要知道這個解法，那當然如果是無序排列的陣列，也可以先排序，再開始透過雙指針的方式去找到所有的答案。

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        def helper(numbers: List[int], target: int) -> List[int]:
            left = 0
            right = len(numbers) - 1
            while left < right:
                total = nums[left] + nums[right]
                if total < target:
                    left += 1
                elif total > target:
                    right -= 1
                else: # s == target
                    res.append([left, right])
            return res
        res = []
        numbers.sort()
        return helper(numbers, target)

```

而 nSum 其實還有另外一個觀念還沒有寫到，那就是利用 Hash Table ，讓我們重回到 2 Sum ，2 Sum 是 LeetCode 的天字第一號題目，又是一個超高頻的題目，我想幾乎每個人都會，雙指針的方式在原始的 2 Sum 題目裡面，其實不是最有效率的，另一個方法不會太難，儘管是簡單的題目，但我在第一次刷題的時候，記得想出這個方法的時候心裡還是有一種「哇！原來這就是刷題的感覺啊，所有的東西我都會，都很常用，但是第一次要把他們用在一起的時候，是沒辦法瞬間做到的」

使用 `Hash Table` 的原理很簡單，那就是我們在遍歷陣列中的每個元素的時候，將目標減去當下的值得到的餘值，**「回」**去 `Hash Table` 裡面找，看看這個餘值有沒有在裡面，如果有的話，代表在迭代到當下這個數字「之前」，有一個數字就是這個餘值，而這個餘值的座標就是我們要的第一個座標。為什麼會在之前呢？因為上面這個步驟，我們透過餘值在 `Hash Table` 找的時候，如果沒有餘值，我們就把當下的數字做為 `key` 放進去 `Hash Table` 裡面，並將其 `value` 設定為陣列的指標。

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        table = {}
        for i in range(len(nums)):
            num = nums[i]
            if target - num in table:
                return [table[target - num], i]
            else:
                table[num] = i

```

`Hash Table` 在 LeetCode 的很多題目裡面，扮演著很重要的角色，因為 `Hash Table` 可以很高效的讓我們儲存值，並記錄很多的資訊，而且可以快速的找到我們要的答案，這個方法好是好在我們不用重新排序陣列，又或是題目如果限制我們對陣列的排序的時候可以用。

而這個解法，我們就可以挑戰解 [454\. 4 Sum II](/interview/coding/454-4-sum-ii) 的概念，在這個題目裡面，題目給我們的是給定四個陣列，從四個陣列中各挑一個數字，其總和要等於給定的目標。