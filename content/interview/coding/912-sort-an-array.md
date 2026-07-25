---
slug: "912-sort-an-array"
section: "coding"
title: "912. Sort an Array"
status: "published"
pinned: false
tags: ["Sorting"]
created_at: 1699156759
updated_at: 1709445306
published_at: 1699156759
---
[912. Sort an Array](https://leetcode.com/problems/sort-an-array/)

## Merge Sort (Accepted)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        return self.merge_sort(nums)

    def merge_sort(self, nums: List[int]) -> List[int]:
        L = len(nums)
        if L <= 1:
            return nums
        m = L //2
        left_list = self.merge_sort(nums[:m])
        right_list = self.merge_sort(nums[m:])
        return self.merge(left_list, right_list)

    def merge(self, left_list: List[int], right_list: List[int]) -> List[int]:
        left_cursor = 0
        right_cursor = 0
        res = []
        while left_cursor < len(left_list) and right_cursor < len(right_list):
            if left_list[left_cursor] < right_list[right_cursor]:
                res.append(left_list[left_cursor])
                left_cursor += 1
            else:
                res.append(right_list[right_cursor])
                right_cursor += 1

        res.extend(left_list[left_cursor:])
        res.extend(right_list[right_cursor:])
        return res
```

## Quick Sort (Accepted)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        return self.quick_sort(nums)


    def quick_sort(self, nums):
        if not nums: return nums # empty sequence case
        pivot = nums[random.choice(range(0, len(nums)))]
        head = []
        middle = []
        tail = []
        for num in nums:
            if num < pivot: head.append(num)
            elif num > pivot: tail.append(num)
            else: middle.append(num)
        return self.quick_sort(head) + middle + self.quick_sort(tail)
```

## Heap Sort (Accepted)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
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

## Bubble Sort (TLE)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        return self.bubble_sort(nums)

    def bubble_sort(self, nums):
        n = len(nums)
        for i in range(n):
            for j in range(0, n - i - 1):
                if nums[j] > nums[j + 1]:
                    nums[j], nums[j + 1] = nums[j + 1], nums[j]
```

-   [1051\. Height Checker](/interview/coding/1051-height-checker)

## Insertion Sort (TLE)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        return self.insertion_sort(nums)

    def insertion_sort(self, nums):
        for i in range(1, len(nums)): 
            key = nums[i]
            j = i-1
            while j >= 0 and key < nums[j] : 
                    nums[j + 1] = nums[j] 
                    j -= 1
            nums[j + 1] = key
```

## Selection Sort (TLE)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        return self.selection_sort(nums)

    def selection_sort(self, nums):
        for i in range(len(nums)):
            _min = min(nums[i:])
            min_index = nums[i:].index(_min)
            nums[i + min_index] = nums[i]
            nums[i] = _min
        return nums
```

## Time Complexity