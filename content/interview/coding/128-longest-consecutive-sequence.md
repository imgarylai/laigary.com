---
slug: "128-longest-consecutive-sequence"
section: "coding"
title: "128. Longest Consecutive Sequence"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1674972900
updated_at: 1704437596
published_at: 1674972900
---
[128\. Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/)

這一題的題目敘述寫的沒有非常清楚，在面試的時候要問清楚。沒寫清楚的地方是題目說了這是一個沒有排序過的陣列，但是實際上要找的字序列，並不是要按照原本題目的順序的。

例如題目中給的例子：

```text
nums = [100,4,200,1,3,2]

```

如果要抱持原先的順序，那只有一個子序列是 `[1, 2]` ，但是題目期待的答案是 `[1, 2, 3, 4]` 這個子序列。如果說要暴力解，最直覺的少說也一定要兩個 `for` 迴圈，時間複雜度絕對大於 $O(N^2)$（實際上是$O(N^3)$）。

## 排序

但是這題可以很快速的簡化，那就是如果先做了排序，時間複雜度就可以直接降低成 $O(N log N)$ ，因為排序過後的陣列，就可以直接找出是不是連續子序列，其中陣列裡面有可能會有重複的值，但是重複的值是沒辦法放入子序列的，可以一開始就用把所有重複的值給去掉。

```python
class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        if not nums:
            return 0

        nums = list(set(nums))
        nums.sort()
        ans = 1
        count = 1
        for i in range(1, len(nums)):
            if nums[i] == nums[i-1]+1:
                count += 1
            else:
                ans = max(ans, count)
                count = 1
        return max(ans, count)

```

## Heap

上面的做法有在官方裡面，我當時想到的方法是另外一個，其實時間複雜度也是一樣，原理也和上面的作法一樣，只是我的排序的方法是透過將元素加入到 heap 裡面，接著再一個一個把最小值 pop 出來，如果前一個最小值比我的當前值小於一，那我就繼續累加，如果不是差一，重新設定計數器。

```python
class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        if not nums:
            return 0
        q = []

        nums = set(nums)
        for num in nums:
            heapq.heappush(q, num)
        first = heapq.heappop(q)
        most = 1
        count = 1
        while q:
            tmp = heapq.heappop(q)
            if tmp == (first + 1):
                count += 1
            else:
                count = 1
            most = max(most, count)
            first = tmp
        return most

```