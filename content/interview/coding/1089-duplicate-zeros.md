---
slug: "1089-duplicate-zeros"
section: "coding"
title: "1089. Duplicate Zeros"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674841743
updated_at: 1709105159
published_at: 1674841743
---
[1089\. Duplicate Zeros](https://leetcode.com/problems/duplicate-zeros/)

題目的要求很簡單，給定一個陣列，當陣列中出現零的時候，我們要多插入一個零，並且把接下來的數字依序往後移一個位置，但是於此同時我們要保持原先陣列的長度，如果數字在位移後的位置超過了原先陣列的長度，我們就不再保留這個數字。

這個題目是屬於記憶體操作的問題，這類型的問題通常都比較棘手，因為這些題目都有非常直覺性的實作方式，很容易在思考的時候被原先的思路給拉著走，導致在思考題目時容易有混淆的情況，不過還是會建議先想出直覺的寫法，面試時寫得出思路的重要性遠遠的比寫出最佳解的重要性來得高。

比較直覺的方法是我需要額外使用一個記憶體空間來儲存結果，接著遍歷這個陣列，當數字不為零的時候，把這個數字放入暫存的記憶體空間，如果遇到為零的時候在暫存的記憶體空間放入兩個零，並且移動兩步，當遍歷完陣列後再把結果取代掉原先的記憶體的內容，實作如下：

```python
class Solution:
    def duplicateZeros(self, arr: List[int]) -> None:
        """
        Do not return anything, modify arr in-place instead.
        """
        n = len(arr)
        temp = []
        i = 0
        while i < n:
            if arr[i] == 0:
                temp += [0, 0]
                i += 1
            else:
                temp.append(arr[i])
                i += 1
        
        i = 0
        while i < n:
            arr[i] = temp[i]
            i += 1
```

但是上面的解法當然不是最佳解，因為這個解答雖然滿足了時間複雜度的最佳解，但是卻不是空間複雜度的最佳解。

當問題提供出上面的解法時，再思考是否有空間最佳解比較合適。

在 Python 中，有一個很方便的方法，那就是可以直接透過記憶體取代，但是這主要是利用到 Python 的語言特性，並不全然是這個題目的最佳解。

```py
class Solution:
    def duplicateZeros(self, arr: List[int]) -> None:
        """
        Do not return anything, modify arr in-place instead.
        """
        i = 0
        n = len(arr)
        while i < n:
            if arr[i] == 0:
                arr[::] = arr[:i] + [0] + arr[i:n-1]
                i += 2
            else:
                i += 1
```

這個題目的最佳解其實滿難的，如果沒有任何提示在面試中可能可以想到輪廓，但是要在三十分鐘內想清楚再加上實作完是有點勉強，這種題目其實比較屬於需要觀察題目的特殊條件，透過特殊條件來完成程式的撰寫。

透過觀察，知道這個題目總共有幾個零其實是最重要的事情，如果一個零都沒有，那什麼都不用移動，接下來就是如果我們知道有 n 個零，那就是從後面開始數的數字，有 n 個數字我們不用保存。像是底下這個範例，我們知道只有一個零，那就是最後一個數字不用保存。

```text
input = [1, 0, 2]
output = [1, 0, 0]
```

可是題目可能還有一種情況如下：

```text
input = [1, 0, 0, 2]
output [1, 0, 0, 0]
```

上述的情況零有兩個，但是看起來卻像是最後只有一個數字 2 不要了，這種情況下我們要判斷的就是，當陣列開始位移的時候，如果零被位移到最後了，這時候我們還是要保持陣列的長度不變，所以最後一個數字為零，但是後面即使要再增加一個零，也是不需要的。

最後一個要考慮的點就是，如果題目真的有非常多個零，我們也不用全部都需要，因為如果有太多的零的時候，複製後超過長度的也都會被捨棄。

如果可以計算出上面最後有哪幾個數字不需要，那就可進而確認有哪些數字是需要的，知道這個條件後，只要把中間有零的地方複製出來就好了，不過這其實就是這個題目的難點，因為如果不想要使用額外的記憶體，那就需要用指針的方式直接把零插入到該位置上，但是這樣的話原先記憶體位址的數值就會不見了。

以上的思考是一般思考陣列的問題的想法，就是從起點往終點遍歷，這個題目的難點就在於能不能想到以下這點，那就是如果知道哪些數字需要保留了，直接從需要保留的最後一個數字開始查看，並且把這個數字直接覆蓋掉原先陣列的最後一個位置。

這樣會有什麼問題嗎？其實不會有問題的，因為在某個位置之後，後面的數字原本就不是我們需要保留的，因此直接覆蓋是沒有問題的，接著就再「往前」一個數字看，這時候如果是零，直接把倒數第二個跟第三個位置的數字全部都取代成零，這樣也不會有問題，因為往前數的指針，一定會比後面這個指針來得慢，頂多是一樣的。

如此以來就可以把上面兩個處理的模式分段處理這個題目：

```python
zeros = 0
n = len(arr) - 1
i = 0

while i <= n - zeros:
    if arr[i] == 0:
        if i == n - zeros:
            arr[n] = 0
            n -= 1
            break
        zeros += 1
    i += 1
```

首先是要先計算出我們需要幾個零

```python
class Solution:
    def duplicateZeros(self, arr: List[int]) -> None:
        """
        Do not return anything, modify arr in-place instead.
        """

        zeros = 0
        n = len(arr)
        i = 0

        while i < n - zeros:
            if arr[i] == 0:
                if i == n - zeros - 1:
                    arr[n - 1] = 0
                    n -= 1
                    break
                zeros += 1
            i += 1

        last = n - zeros - 1

        while last >= 0:
            if arr[last] == 0:
                arr[last + zeros] = 0
                zeros -= 1
                arr[last + zeros] = 0
            else:
                arr[last + zeros] = arr[last]
            last -= 1

```