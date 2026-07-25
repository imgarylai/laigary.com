---
slug: "170-two-sum-iii-data-structure-design"
section: "coding"
title: "170. Two Sum III - Data structure design"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[170\. Two Sum III - Data structure design](https://leetcode.com/problems/two-sum-iii-data-structure-design/)

在 2 Sum 裡面，有一個比較高效率的解法，就是使用 Hash Table 來解決問題，這題物件的題目就很簡單，不過有一個小地方要注意，那就是之前我們的 Hash Table 是記錄元素在陣列中的位置，但是這個物件讀取資料的方式是透過 Data Stream 的方式讀入，我們並沒有儲存位置，我們反而是記錄這個數字出現的次數。

可是這樣就會有一個問題要注意，例子是如果我先輸入一個 `2` 。接著，程式收到指令，再去找看看有沒有兩個數字的總和是 `4` ，這個情況底下，我要找的另外一個數字也是 `2` ，所以要判斷兩個情況：

1.  如果 2 Sum 是兩個一樣的數字，要檢查是否該數字已經輸入過了兩次
2.  如果不同，那就只要判斷另外一個數字是否存在就好

```python
class TwoSum:

    def __init__(self):
        """
        Initialize your data structure here.
        """
        self.table = defaultdict(int)


    def add(self, number: int) -> None:
        """
        Add the number to an internal data structure..
        """
        self.table[number] += 1


    def find(self, value: int) -> bool:
        """
        Find if there exists any pair of numbers which sum is equal to the value.
        """
        for key in self.table:
            target = value - key
            if target == key and self.table[key] >= 2:
                return True
            if target != key and target in self.table:
                return True
        return False

```

## 雙指針

這一題也可以用雙指針來寫，不過要注意的是，我們需要檢查陣列的排序狀態。

```python
class TwoSum:

    def __init__(self):
        """
        Initialize your data structure here.
        """
        self.arr = []
        self.sorted = False


    def add(self, number: int) -> None:
        """
        Add the number to an internal data structure..
        """
        self.arr.append(number)
        self.sorted = False


    def find(self, value: int) -> bool:
        """
        Find if there exists any pair of numbers which sum is equal to the value.
        """
        if self.sorted:
            left = 0
            right = len(self.arr) - 1
            while left < right:
                total = self.arr[left] + self.arr[right]
                if total == value:
                    return True
                elif total > value:
                    right -= 1
                elif total < value:
                    left += 1
            return False
        else:
            self.arr.sort()
            self.sorted = True
            return self.find(value)

```