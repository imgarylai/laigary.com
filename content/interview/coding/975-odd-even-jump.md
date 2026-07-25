---
slug: "975-odd-even-jump"
section: "coding"
title: "975. Odd Even Jump"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674964511
updated_at: 1674964846
published_at: 1674964511
---
[975\. Odd Even Jump](https://leetcode.com/problems/odd-even-jump/)

💡

這一題建議在後面練習的時候再來寫

根據網路上的數據，這一題曾經是 Google 面試的高頻動態規劃題目，Leetcode 的難度是困難的題目，一般而言我刷題的目標都是放在困難度中等的題目，不過有些困難的題目如果不是存在著特殊解法，是很好幫助我們去看看如何把不同的演算法。

這一個題目是問說，有一個陣列，裡面有不同的數字隨機排列，目標是要找出有幾個點可以通過一個特殊的規則跳到終點，也就是陣列中的最後一個位置，特殊的規則如下：

是第「奇數」次跳躍時，下一次可以跳的點是在當前位置 `arr[i]` 右側的任意一個位置 `j` ，只要 `j > i` 且 `arr[j]` 的值大於或等於 `arr[i]` ，如果說有很多地點可以跳，那就選比 `arr[i]` 還大的值中，最小的那一個點，如果遇上有多個相同的數字，選擇最近的那個跳過去（`j`最小）。也就是說要考量的點按照順序如下：

1.  `j > i`
2.  `arr[j] >= arr[i]`
3.  滿足以上條件最小的 `arr[j]`
4.  滿足以上條件最小的 `j`

```text
arr = [1, 3, 2, 2]
i = 0 的時候，j = 1, j = 2, j = 3 都符合第二個條件
但是只有 j = 2, = 3 滿足第二個條件
但是要選比較小的 index ，所以只能跳到 2
```

是第「偶數」次跳躍時，下一次可以跳的點是在當前位置 `arr[i]` 右側的任意一個位置 `j` ，只要 `j > i` 且 `arr[j]` 的值小於或等於`arr[i]` ，如果說有很多地點可以跳，那就選比 `arr[i]` 還小的值中，最大的那一個點，如果遇上有多個相同的數字，選擇最近的那個跳過去（`j`最小）。

考慮的順序同奇數次跳躍其實光到這一步，要理解整個題目的規則就有點難度了，就網路上分享的經驗中，Google 的確喜歡考這樣的題目，考察面試者的反應與理解題目的思路。

## 暴力解

這個題目我一開始還是先使用暴力解，我會把我的想法一步一步記錄起來。

我想先解決最簡單的第一個問題，那就是每次我要如何判斷是奇數跳或是偶數跳？這是一個在現實應用中也很常用到的技巧，奇偶變換的問題，其實就是布林值的轉換，我不用確切記得當前的步數是第幾步，我只要知道我目前是在奇數的位置，下一步就一定是偶數。

下面的程式碼完成了主要的概念，我用 `curr` 記錄目前是從哪個點開始出發，每次跳躍我都會前進一些 `index` ，一直到如果我可以走到最後，就代表當前的位置 `i` 存在著路徑可以走到最後一個位置。

```python
class Solution:
    def oddEvenJumps(self, arr: List[int]) -> int:
        ans = 0
        for i in range(len(arr) - 1):
            curr = i 
            isOdd = True
            while curr < len(arr):
                if isOdd:
                    # TODO
                else:
                    # TODO
                isOdd = not isOdd
            if curr == len(arr) - 1:
                # path does exist            
                ans += 1
            else:
                # path doesn't exist
                continue
        return ans
```

接著要處理題目比較困難的部分了，我一開始想到的直覺方法是直接去掃描整個右半部的陣列，先找出所有大於當前位置的值，然後再找出這些值得最小值，再比較哪個 index 最小，這樣想想其實沒有很好做，我後來就想到了其實我可以直接使用 `heap` 來處理就好，因為我要找的是**最值**，沒有排序找最值最好的方法就是用 `heap` ，加入 `heap` 的方式很簡單，我只要選擇比當前最大值大的值加入進去就好，也順便把 `index` 放進去，最後直接取最上面的值，就是最小值了。

這裡要注意的一點是，右半部可能並沒有路徑可以走，那這樣的話就是 `heap` 會是空值，我會返回 `-1` 作為，往右前進的索引並不存在。

```python
class Solution:
    def oddEvenJumps(self, arr: List[int]) -> int:

        def oddSearch(curr):
            heap = []
            heapq.heapify(heap)
            for i in range(curr+1, len(arr)):
                if arr[curr] <= arr[i]:
                    heapq.heappush(heap, (arr[i], i))
            if not heap:
                return -1
            else:
                val, index = heapq.heappop(heap)
            return index

        def evenSearch(curr):
            heap = []
            heapq.heapify(heap)
            for i in range(curr+1, len(arr)):
                if arr[curr] >= arr[i]:
                    heapq.heappush(heap, (-arr[i], i))
            if not heap:
                return -1
            else:
                val, index = heapq.heappop(heap)
            return index

        ans = 1
        res = []
        memo = {}
        for i in range(len(arr) - 1):
            curr = i 
            isOdd = True
            while curr < len(arr):
                if isOdd:
                    index = oddSearch(curr)
                    if index == -1:
                        break
                    curr = index
                else:
                    index = evenSearch(curr)
                    if index == -1:
                        break
                    curr = index
                isOdd = not isOdd
            if curr == len(arr) - 1:
                ans += 1
                res.append(i)

        return ans
```

這樣的時間複雜度是很高的，因為我們至少需要遍歷一次陣列，每次跳躍很不巧的可能只能跳一格，花大約 $O(nlogn)$ 的時間處理 `Heap` ，總共的時間複雜度約是 $O(n^{3}logn)$。

## 動態規劃解

題目做多了，遇到這種邊走邊選擇的題目，很直覺的就可以想到要怎麼用動態規劃解，這一題困難的是在做選擇的時候，需要考慮情境，像是我如果可以到位置 `j` ，可能是之前的格子在奇數跳的時候跳過來的，也可能是之前的格子，在偶數跳的時候跳過來的，兩種跳法也都不一樣，我一開始在寫的時候也會想，如果要考慮情境的話，還可以用動態規劃來解嗎？因為這樣有重疊子問題嗎？

這個題目一開始我也是寫的時候也是寫不出來，我先參考了別人講解的思考過程後，才嘗試看看要怎麼寫的。

我們先看看能不能先從第一個困難點解決，那就是先解決我們要往哪邊跳，如果可以先算出在奇數時該先跳到哪裡，和偶數時要跳去哪裡，那就會很方便，可以少去每次重新檢查的行為。

建立這個座標的方式滿特別的，首先既然要比大小，所以需要將原先的陣列做排序，可是排序玩原先的位置資訊就不在了，但是偏偏我們要知道他原先的索引，才能知道怎麼做。

這個答案是別人的做法，給我幾天我可能可以想到類似的寫法，面試一個小時的時間我自己是真的做不出來。

```python
stack = []
odd_next_jump = [0] * n

# 將原先陣列的元素與索引一起取出後排序，這樣的排序會有這樣的特性:
# 裡面的元素從小排到大，如果遇上相同的值，就會依照索引由小排到大
for ele, idx in sorted([ele, idx] for idx, ele in enumerate(arr)):
    # 所有已經被放入到 stack 的索引，其索引所對應到的值
    # 一定比我當前索引對應到的值小，所以如果其索引在我左邊（stack[-1] < i）
    # 代表 stack[-1] 目前存的索引，他的下一步會是現在的索引 i 
    while stack and stack[-1] < i:
        # 於是，我們可以把這個記錄起來
        # ex: next_higher[2] = 4 就是代表 idx 2 可以走到 idx 4 
        odd_next_jump[stack.pop()] = i
    stack.append(i)
```

反之亦然

```text
stack = []
even_next_jump = [0] * n

for ele, idx in sorted([-ele, idx] for idx, ele in enumerate(arr)):
    while stack and stack[-1] < idx:
        even_next_jump[stack.pop()] = i
    stack.append(idx)
```

最後一步就是要完成動態規劃的部分了。

我們會需要兩個 `dp` 的陣列，分別是 `dp_odd` 和 `dp_even` 這個要記錄的是，每個位置是否可以透過奇數跳或是偶數跳跳過來，這也是最後一個很燒腦的部分。

首先，不管是 `dp_odd` 或是 `dp_even` 最後一個位置就是陣列中的最後一個元素，我們都設定是 `True` 。

```python
dp_odd = [False] * n 
dp_even = [False] * n
dp_odd[-1] = True
dp_even[-1] = True
```

一直到這個部分比較好理解，接下來最後一個部分就是要透過動態規劃來完成，這裡是一個自底向上的動態規劃，只是這個自底向上的行程是從最後一個位置往前面推，為什麼呢？**因為最後一個位置，其實反而是這個題目的 Base Case** 。

往前走的方向是這樣判斷的，如果說 `dp_odd[i]` 能往前走，要看的是之後的 `dp_even[k]` 是不是可以到的，`k` 取得的方式是看看 `odd_next_jump[i]` 能不能到，如果不能到的話就會是 `0` ，那 `0` 又比 `i` 前面，所以這時候 `dp_even[0]` 會是 `False` 這時候 `dp_odd[i]`就會是 False 。

整個情況其實有點難想，尤其又是從後往前推，我覺得最容易的理解方式是考中斷點，用中斷點來看所有的變數的情況是什麼樣子。

真實面試中的時候，或許我真的天資不夠聰穎，我自認應該是沒辦法不靠任何中斷點就寫出 Bug Free 的程式碼，可是我覺得理解這個題目讓我對於動態規劃的認識多了很多，畢竟是經典題目，多看無益！