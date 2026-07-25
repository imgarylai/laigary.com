---
slug: "42-trapping-rain-water"
section: "coding"
title: "42. Trapping Rain Water"
status: "published"
pinned: false
tags: ["Classic", "Two Pointers"]
created_at: 1674973112
updated_at: 1765068172
published_at: 1674973112
---
[42\. Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/)

要寫這一題之前，要先了解 [11\. Container With Most Water](/interview/coding/11-container-with-most-water) 的概念，這一題比較特別，題目給定的陣列像是表達一個等高線圖，其中這個等高線內就會有山谷，有山谷的地方就能儲存水，我們要求出總共能夠有多少水被儲存在這個山谷。

先了解這個題目給的所有條件，那就是如果說今天給定的等高線圖，如果只有兩個點，這樣是沒有辦法儲存任何水的，山谷能有的最多水要被包在兩側的山峰內。如果只有一邊有高峰，那水都會流走。

也就是說最少要有類似 `[1, 0, 1]` 這樣的情況才能有水。

接著分析比較複雜一點的情況，像是 `[1, 0, 2, 1, 3]` 這樣的話，在位置 0 到 2 之間，其山谷是 `[1, 0, 2]` ，這和之前水桶的問題一樣，最多只能儲存一單位的水，下一個儲存水的地方是 `[2, 1, 3]` ，不過這裡最多只能儲存一單位的水。所以題目的答案就是 2 。

下一個例子，`[1, 0, 2, 1, 1, 1, 1, 1, 3]` 這樣的情況的話，第一個部分和上面一樣，但是右邊第二的部分就會有點不好算了，因為我們要不斷的找到右邊界，才能知道能裝多少水。

這個例子還算好處理的，如果上面的這個例子稍微修改一點點，`[1, 0, 2, 1, 0, 1, 0, 1, 3]` 這樣就不能單純的只找右邊的高點了，因為中間有更深的山谷，會可以儲存更多的水，又或是 `[1, 0, 2, 1, 1, 1, 1, 1, 1]` 這樣的例子，其實右邊只是一塊平地，根本不能裝水。

其實到這裡，我有想過該不會是要透過遞迴來處理？把大問題慢慢分解成小問題來處理？可是如果每次遞迴時，如果傳一個子陣列進去，子陣列會不知道上層問題的兩側高度，可能會造成在子問題中看起來儲存不了水，但是實際上可以的，這樣就會漏算面積，這個要怎麼判斷儲存水量的方法，就是這題最困難的地方。

但是回到一開始 `[1, 0, 1]` 的例子，如果說我們現在正在座標為 1 的時候，如果說我們知道哪些資訊，就可以確定那個位置可以裝水？這個比較好想，那就是在他的右手邊，一定有一個座標的高度比他高，在他的左手邊，也一定有一個座標的高度比他高。像是更複雜的例子，`[1, 0, 2, 1, 1, 1, 1, 1, 3]` 在座標 `3 ~ 7` 的山谷中，我們也都知道左邊有座標比他們都高，右邊也有座標比他們都高，因此這樣也就能確定那邊一定可以裝水。

有了這個想法後，可以再回到 `[1, 0, 2, 1, 3]` 的例子，座標 `1` 和 `3` 都可以裝水，雖然一個高度是 `0` ，一個高度是 `1` ，但是能裝的水容量都一樣是 `1` ，因為他們那一個格子的容量，都被兩邊高度的最小值給決定了，而該格可以裝的容量就是 `min(maxHeightFromLeft, maxHeightFromRight) - height[i]` ，有了這個資訊後，只要去思考 `maxHeightFromLeft` 和 `maxHeightFromRight` 的意義就好，我們只記錄最大值這樣是合理的嗎？這時候可以看一個極端一點的例子 `[1, 100, 0, 10, 5, 200]` 在座標 `4` 的地方，高度是 `5` ，右側的高度我們應該要看 `10` 還是 `100` ？看 `10` 是不對的，因為 `10` 的左側其實是 `100` 他也能繼續裝到 `100` 的高度。

## 預先計算左右兩次的最高值

```python
class Solution:
    def trap(self, height: List[int]) -> int:
        n = len(height)
        if n == 0:
            return 0
        
        lmax = [0] * n
        rmax = [0] * n

        lmax[0] = height[0]
        rmax[n - 1] = height[n - 1]

        for i in range(1, n):
            lmax[i] = max(lmax[i-1], height[i])
        
        for i in range(n - 2, -1, -1):
            rmax[i] = max(rmax[i+1], height[i])

        ans = 0
        for i in range(1, n - 1):
            ans += min(lmax[i], rmax[i]) - height[i]
        
        return ans
```

## 雙指針

分析到這裡，就可以開始寫程式了，下一個難點是在於，為什麼一樣可以繼續用雙指針的方式來做遍歷？其實這個和題目的特性有關，如果左側的邊界比較矮，代表左側邊界才是決定每個位置的山谷可以裝多少水的邊界，這時候就要從左邊往中間搜尋，看哪些地方比他矮並找出能裝多少水。

像是：`[5, 4, 3, 2, 1, 100]` 這時候右邊基本上是不用動的，我們要擔心的反而應該像是 `[5, 4, 3, 2, 1, 100, 2, 3, 4, 5, 6]` 這種，中間有一個很高的山峰，把兩側山谷分開的情況，這個情況反而很好解釋為什麼要用雙指針的方式來找，當開啟上帝之眼來觀看的時候，從左側不斷的往中間前進是非常合理的事情，當走到山峰 `100` 的時後才會換右側往中間搜尋。

```python
class Solution:
    def trap(self, height: List[int]) -> int:        
        if len(height) <= 2:
            return 0

        left = 0
        right = len(height) - 1
        area = 0

        while left < right:
            leftHeight = height[left]
            rightHeight = height[right]

            if leftHeight <= rightHeight:
                left += 1
            elif leftHeight > rightHeight:
                right -= 1
        return area

```

剩下一個我們需要的資訊，那就是當我從否一個方向往中間出發的時候，另一側的最大高度為何？所以我們需要有另外兩個變數來幫助我們更新位置 `i` 左右兩側的最大值。一開始的最大高度就是最兩側是因為最左和最右側的點，不管怎麼樣都一定無法儲存水份，就會把兩側端點設定為暫時的兩側最大值。

接著就可以看要從左側往中間前進，或是右側往中間前進，到了這裡只剩下最後個一個地方要處理，那就是也有可能，這座山就是 `[1, 2, 3, 3, 2, 1]` 根本沒有任何山谷，所以不管我們怎麼往中間走，都不會有任何的山谷可以存水，遇到這種情況，那就是要看當下的位置，是不是比目前記錄到的最大值還高，如果是的話，我們就更新該側的最大值就好，該格絕對沒有辦法儲存水。

```python
class Solution:
    def trap(self, height: List[int]) -> int:        
        if len(height) <= 2:
            return 0

        left = 0
        right = len(height) - 1

        maxHeightFromLeft = height[0]
        maxHeightFromRight = height[len(height) - 1]

        area = 0

        while left < right:

            leftHeight = height[left]
            rightHeight = height[right]

            if leftHeight <= rightHeight:

                if leftHeight >= maxHeightFromLeft:
                    maxHeightFromLeft = leftHeight
                else:
                    area += maxHeightFromLeft - leftHeight
                left += 1

            elif leftHeight > rightHeight:

                if rightHeight >= maxHeightFromRight:
                    maxHeightFromRight = rightHeight
                else:
                    area += maxHeightFromRight - rightHeight
                right -= 1

        return area

```