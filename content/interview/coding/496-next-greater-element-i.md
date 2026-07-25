---
slug: "496-next-greater-element-i"
section: "coding"
title: "496. Next Greater Element I"
status: "published"
pinned: false
tags: ["Monotonic", "Stack"]
created_at: 1743566845
updated_at: 1784780779
published_at: 1743566845
---
[496. Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/)

這一題是 [Monotonic](/interview/coding?tag=Monotonic) 的題目，但是他的變形其實滿難的，會建議先從 [739. Daily Temperatures](/interview/coding/739-daily-temperatures) 先熟悉後，再來處理這個。

題目給定兩個陣列，其中 `nums1` 是 `nums2` 的子集，`nums1` 和 `nums2` 之間的順序是隨機的，並沒有任何關聯。

為了方便，這裡先使用題目的例子：

```text
nums1 = [4,1,2], nums2 = [1,3,4,2]
```

但是題目要問，如果今天我們在 `nums1` 看到 `4` ，要找到 `4` 在 `nums2` ，並且看右側，下一個比自己大的值是多少。在 `nums2` 裡，`4` 右側沒有更大的值，就記錄 `-1` ，以此類推。

我想到的是兩個步驟的做法：

第一個步驟，先把 `nums2` 每個位置右側的下一個最大值找出來。

```python
class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        n = len(nums2)
        tmp = [-1] * n
        s = []
        for i in range(n-1, -1, -1):
            while s and s[-1] <= nums2[i]:
                s.pop()
            if s:
                tmp[i] = s[-1]
            s.append(nums2[i])
```

我們記錄的方式是該位置右邊的下一個最大值，但是這樣 `nums1` 還沒有辦法馬上利用，因為 `nums1` 只有數字而已，並不知道每個數字的位置。

第二個步驟，把 `nums2` 每個數字對應的位置，透過 [Hash Table](/interview/coding?tag=Hash%20Table) 的方式記錄下來。

這裡可以一次多做一部，那就是我們在記錄每個位置的下一個最大值時，裡面每個位置和 `nums2` 是有對應的。

最後就可以一起完成：

```python
class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        n = len(nums2)
        tmp = [-1] * n
        s = []
        for i in range(n-1, -1, -1):
            while s and s[-1] <= nums2[i]:
                s.pop()
            if s:
                tmp[i] = s[-1]
            s.append(nums2[i])
        m = {}
        for i in range(n):
            m[nums2[i]] = tmp[i]
        res = []
        for num in nums1:
            res.append(m[num])
        return res
```

時間複雜度是 $O(n)$

空見複雜度是 $O(n)$