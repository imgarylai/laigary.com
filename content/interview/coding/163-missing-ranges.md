---
slug: "163-missing-ranges"
section: "coding"
title: "163. Missing Ranges"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[163\. Missing Ranges](https://leetcode.com/problems/missing-ranges/)

雖然這一題 LeetCode 是標記簡單，但是細節上要想清楚我覺得難度應該有接近中等的等級，會把這一題我放在時間區間問題，是因為概念很類似 [759\. Employee Free Time](/interview/coding/759-employee-free-time) ， 在那個題目裡面，我們要找出員工們的空閒時間，找的方法就是先把重疊的區間全部都先整理好，再從區間之間來找到空閒的時間。

這一題也算是時間區間的問題，不過題目給的不是區間，是一連串的時間點，這個時間點是經過排序的，另外這個題目又再加上一個額外的條件，那就是時間區先的下限與上限是另外設定的，而且這個上下限，可以與原本時間區間的上下限重疊，也可以不重疊，像是下面的例子就是上下限與題目給定的陣列都重疊，LeetCode 題目中給的例子下限有重疊，上限沒有重疊。

```text
nums = [0,1,3,50,75]
lower = 0
upper = 75

```

題目的回傳答案也有條件，首先就是要先了解到題目要求的區間是怎麼樣？那就是如果有區間是 `[1, 3]` 那要回傳的答案就是 `["2"]` ，如果是 `[1, 4]` 那答案就是 `["2->3"]` ，這裡會需要考慮的是，區間的重疊問題，因為像是在 [759\. Employee Free Time](/interview/coding/759-employee-free-time) 題目裡面的員工空閒時間和上班時間，是可以交疊的。例如：員工的忙碌的時間是 `[[1, 2], [3, 4]]` 那空閒的時間就是 `[2, 3]` ，不過由於在這個題目的表達方式會變成 `[1, 2, 3, 4]`，所以有這樣的情況視為交疊，不會有失去的區間。

因此從上面的分析，看題目給定陣列的時間序列裡面，其中任意的兩個時間 $[…, t_{i-1}, t_{i}, …]$ 如果

-   $t_{i} - t_{i-1} = 2$ ：那就會產生一個消失的區間，可以以 $[t_{i}-1]$ 或是 $[ t_{i-1} + 1]$ 來表達。
-   $t_{i} - t_{i-1} > 2$ ：那就會產生一個消失的區間，可以以 $[ t_{i-1} + 1 \rightarrow t_{i}-1]$   來表達。

到了這裡，基本邏輯已經寫出來了，但是我們還沒有處理到上下限的問題。但我想要先暫停處理一下，如果說沒有上下限，以上的邏輯是不是已經足夠了？可以把上面的例子，先放到 LeetCode 的測試裡面試試看。因為如果上下限和給定的陣列一樣，那就等於沒有加上下界，寫出來的程式碼應該會如下：

```python
class Solution:
    def findMissingRanges(self, nums: List[int], lower: int, upper: int) -> List[str]:
        intervals = []

        for i in range(1, len(nums)):
            prev = nums[i-1]
            curr = nums[i]
            if curr - prev == 2:
                intervals.append(str(curr-1))
            if curr - prev > 2:
                intervals.append(str(prev+1) + '->' + str(curr-1))

        return intervals

```

上面的題目只分析到了數列中間的一般情況的部分，還沒有處理到上下限的部分，題目中的上下限的作用是避免產生無限的時間序列，上下限應該要可以和原本的時間序列一起處理才對啊，為什麼不能直接加呢？本文一開始的分析，數列中的區間是不能交疊的，可是如果最後遇到的是上下限，是可以一起交疊的，例如：`nums = [......, 8], upper = 10` 那最後一個答案會是 `["9 -> 10"]` 而不是 `["9"]` 。

分析到了這裡，讀者應該就會做了，既然可以交疊，那其實不如移開區間（像是二分搜索一樣，可以藉由等號的存在與否，確定區間的範圍）把下界減一和把上界加一，再和原本的數列放在一起，那就可以成功的用上面的方法來找出所有的區間。

完成的程式碼如下：

```python
class Solution:
    def findMissingRanges(self, nums: List[int], lower: int, upper: int) -> List[str]:
        intervals = []

        nums = [lower - 1] + nums + [upper + 1]

        for i in range(1, len(nums)):
            prev = nums[i-1]
            curr = nums[i]
            if curr - prev == 2:
                intervals.append(str(curr-1))
            if curr - prev > 2:
                intervals.append(str(prev+1) + '->' + str(curr-1))

        return intervals

```