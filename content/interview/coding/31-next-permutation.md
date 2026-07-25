---
slug: "31-next-permutation"
section: "coding"
title: "31. Next Permutation"
status: "published"
pinned: false
tags: ["Backtrack", "Other"]
created_at: 1674972898
updated_at: 1710305004
published_at: 1674972898
---
[31\. Next Permutation](https://leetcode.com/problems/next-permutation/)

題目是給定一個數字，要使用這個數字有使用到的數字，並透過排列組合，找到下一個排列組合比現在這個數字還大，可是卻是所有可行的排列組合中最小的，如果說現在的這個數字已經是排列組合中最大的數字，那我們就回傳排列組合中最小的數字。這個排列也可以稱做一種字典排列。

我的第一個直覺想法是，既然是排列組合題目，那我就把所有的排列組合窮舉出來，並且由小到大的排序，找出哪個數字和目前的數字相同，下一個數字就會是字典數了，當然如果是最大的數字，那就返回最小的數，題目還有要求要只在記憶體修改，那是這個並不是太困難的事情。

### 回溯法

```python
class Solution:
    def nextPermutation(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        sortedNums = sorted(nums)
        res = []
        def backtrack(curr, counter):
            if len(curr) == len(sortedNums):
                res.append(list(curr))
                return
            else:
                for num in counter:
                    if counter[num] > 0:
                        counter[num] -= 1
                        curr.append(num)
                        backtrack(curr, counter)
                        counter[num] += 1
                        curr.pop()

        backtrack([], Counter(sortedNums))
        i = 0
        while i < len(res):
            if ''.join(map(str, res[i])) == ''.join(map(str, nums)):
                break
            i += 1
        if i == len(res) - 1: 
            nums[::] = res[0]
        else: 
            nums[::] = res[i+1]

```

但是我的做法時間複雜度非常高，會超時。

### 數學意義

第一個階段，如果今天的數列剛好是降序排列，那該該數字就會是其最大的字典序的排列方法，要找到下一個字典序的方式就是把整個數列改成升序排列，第一個階段比較好處理。

這時候改成先看如果整個數列都是升序排列，會需要怎麼處理？下一個字典數會嚴格的尊後比現有的數字大的最小數字，所以最好的方法就是把最後一個數字跟倒數第二個數字對調，這時候就會得到下一個字典樹了。例如：`[1, 2, 3, 4]` -> `[1, 2 4, 3]` 。

第二個階段是如果今天這個數字並不是有規律的排列，要怎麼處理？

如果是 `[1, 2, 4, 3, 1]` 的話，需要先觀察一些現象

1.  我要選擇的時候，從左往右，一定要越往右邊找越好，因為一定是越靠近個位數的改變，會讓整體數字加上去最小。
2.  但是我要選擇的數字，又不能右側都比我小，因為如果右側都比我小，任何一個數字跟我交換，都會是更小的數字，不符合字典排序的意義，所以如果從右往左，我要找一個數字要剛好我我現在當前這的數字還小。
3.  第二點的邏輯其實也符合第一點，那就是期待中能交換的數字，要越往右邊越好，不如從最右邊直接開始找起，找到一個數字剛好剛好比後面的數字來的小，在此例子中，就會選到的是 `2` 。
4.  接著考慮要和後面哪個數字做交換：
    1.  4 是個可以考慮的數字，我們要看看後面有沒有大於 `2` 的最小數字，這樣才可以確保不會一次跳太多。
    2.  3 也是可以考慮的數字。
    3.  1 就不能選擇，因為如果 `2` 和最後一個數字 `1` 交換的話，會讓整體的數字遞減。
5.  交換後會變成 `[1, 3, 4, 2, 1]` 但是其實這樣不會是最完美的結果，最好的結果應該是 `[1, 3, 1, 2, 4]` 就差在後半部的數字應該要從降序排列改成升序排列（重新回到看第一階段）

綜合上述的過程，演算法可以改寫成

1.  從左到右，如果是遞增的數列，一路一直尋找到第一個遞減的數字於位置 `i` 。
2.  接著要在 `i` 的右側找出「比 `nums[i]` 大的最小值」
3.  交換 1 與 2 的位置
4.  交換後 `i` 右側的數字依然會按照順序排列，將其部分反轉後變成升序排列。

```python
class Solution:
    def nextPermutation(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        i = len(nums) - 2
        while i >= 0 and nums[i] >= nums[i+1]:
            i -= 1

        if i >= 0:
            j = len(nums) - 1
            while nums[i] >= nums[j]:
                j -= 1

            nums[i], nums[j] = nums[j], nums[i]

        i += 1
        k = len(nums) - 1
        while i < k:
            nums[i], nums[k] = nums[k], nums[i]
            i += 1
            k -= 1
```