---
slug: "75-sort-colors"
section: "coding"
title: "75. Sort Colors"
status: "published"
pinned: false
tags: ["Array", "Hash Table", "Sorting"]
created_at: 1699156611
updated_at: 1766304281
published_at: 1699156611
---
[75. Sort Colors](https://leetcode.com/problems/sort-colors/)

這個題目的要求基本上就是排序，並且但是必須要在原先的記憶體上去做操作，第一個解法可以參考 [921\. Sort an Array](/interview/coding/912-sort-an-array) 關於各種排序的寫法，使用到直接是透過操作記憶體的排序方法即可。

如果是使用的方法是排序來解決這個問題，理論的時間複雜度是 $O(nlog(n))$

這一個題目的另一個解法其實不會很難，但是其實這是一個很好用來講解的面試題目的例子，尤其是這個題目的特性其實很容易包裝成各個公司的一些應用場景來迷惑面試者。

這個題目有另外一個條件，裡面會出現的顏色只有三種，只是剛好是用 0, 1, 2 來代替，但是如果這時候題目改成這裡面的顏色也是有三種，是紅色、綠色、藍色（RGB）隨機排列，然後我們也想要按照某個順序排列，並且也要直接透過操作記憶體來實作。

如果透過這種方式問，其實反而比較不容易想到要用排序來做，另一個更直覺的方式會變成乾脆先掃描三種顏色各出現幾次，接著就計算每個顏色剩餘的數量，依序取代掉原先陣列的元素，由於題目條件的限制，這個演算法的時間負責度其實反而降到了 $O(3n) ~= O(n) $

```python
class Solution:
    def sortColors(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        counter = Counter(nums)
        
        colors = [0, 1, 2]
        idx = 0    
        for color in colors:    
            while counter[color] > 0:
                nums[idx] = color
                counter[color] -= 1
                idx += 1
```
```python
class Solution:
    def sortColors(self, nums: List[int]):
        # Your code goes here
        
        slow = 0
        fast = 0

        while fast < len(nums):
            if nums[fast] == 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
            fast += 1
        
        fast = slow
        
        while fast < len(nums):
            if nums[fast] == 1:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
            fast += 1
```
```python
class Solution:
    def sortColors(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        return self.heap_sort(nums)

    def heap_sort(self, nums):
        def heapify(nums, n, i): 
            l = 2 * i + 1
            r = 2 * i + 2

            largest = i
            if l < n and nums[largest] < nums[l]: 
                largest = l 

            if r < n and nums[largest] < nums[r]: 
                largest = r 

            if largest != i: 
                nums[i], nums[largest] = nums[largest], nums[i]

                heapify(nums, n, largest)

        n = len(nums) 

        for i in range(n//2+1)[::-1]: 
            heapify(nums, n, i) 

        for i in range(n)[::-1]: 
            nums[i], nums[0] = nums[0], nums[i]
            heapify(nums, i, 0)
```