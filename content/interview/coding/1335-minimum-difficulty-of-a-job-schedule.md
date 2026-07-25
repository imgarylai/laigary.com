---
slug: "1335-minimum-difficulty-of-a-job-schedule"
section: "coding"
title: "1335. Minimum Difficulty of a Job Schedule"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1705721786
updated_at: 1709446493
published_at: 1705721786
---
[1335\. Minimum Difficulty of a Job Schedule](https://leetcode.com/problems/minimum-difficulty-of-a-job-schedule/)

這個題目其實寫的滿不清楚的，面試如果遇到這個題目其實也考察如何向面試官搞清楚題目的流程的。

這個題目是給定一個陣列，這個連串是一連串的工作難度，另外有給定一個工作天數 `d` ，需要把上述的所有工作，分散到 `d` 天來完成。而且要恰好分配到 `d` 天完成，不能沒有分配完，也不能少分配天數。

最終的目標是在分配完所有工作後，可以得到最小的工作難的總和，而每一天的工作難度，取決於該天所分配到的所有工作中，難度最大的工作。

這個題目難的地方難在這個題目的遞迴關係式並不好想，但是可以嘗試看看透過觀察題目的方式來去找。

1.  在 `i = 0` 的時候，我可以選擇兩條路
    1.  第 `1` 天我就選擇這個工作，接著找出 `i = 1` 時以及剩餘 `d - 1` 的最佳解為何，工作量是 `jobDifficulty[0] + dp(1, d - 1)`
    2.  再多選一個 i = 1 的工作，所以還是保持 `d` 天要分配，工作量會是 `dp(1, d)`
2.  目標是要找到 `min(jobDifficulty[0] + dp(1, d - 1), dp(1, d))` ，

但是題目有另外一個困難點是，一個工作日的工作量是選擇的所有工作量中，以工作量最高為標準，第一個情況因為選擇只有第一個工作要選或不選，所以這個工作一定會是最大的工作量，上面的遞迴關係式中，還缺少了一個如何記錄當前選擇的所有工作中最大的工作量。

重新回到開始的例子

1.  由於當前我們選擇了第一個工作，因此可以知道這個工作並不需要在之後選擇中去考量。
2.  由於當前我們沒有選擇這個工作，因此我們知道現在這個工作「可能」是即將要選擇的工作中，最大的工作量。

綜上所述，每次遞迴時需要把當前的最大工作量給傳遞下去，這個部分和程式的特性比較有關，比較難用文字來描述，但是這樣大概可以知道遞迴關係式可以以這樣的方式來表達：

$$
dp(i, d, currMax) = min(currMax + dp(i + 1, d - 1, ???), dp(i + 1, d, currMax))
$$

其中需要討論一下為什麼上述的關係式中，會有問號的存在？因為在第一個情況，這個情況已經把當前的最大值作為選擇的目標了，對於之後的遞迴關係式中，這個紀錄的最大值已經不重要了，所以不能冒然的再叫傳進去，其實可以傳入一個無限小的數值就好，因為既然這個數字不再重要了，當程式在取一個最大值時，最小值就會直接被取代掉。

這個遞迴關係式真的不是很好想，但是有了這個關係式後，程式就比較好寫了。

```python
class Solution:
    def minDifficulty(self, jobDifficulty: List[int], d: int) -> int:
        
        def helper(i, d, curr_max):            
            # 當前最大值的取法，當前這個這個工作難度跟之前的最大工作難度來相比
            curr_max = max(curr_max, jobDifficulty[i])
            res = min(
                # 再多選一個工作，所以要把當前最大值繼續帶下去
                helper(i + 1, d, curr_max),
                # 選了足夠的工作進行一天的分配，進行下一輪的選擇工作，此時當前的最大值已經不重要了
                curr_max + helper(i + 1, d - 1, float('-inf'))
            )
            return res
        
        return helper(0, d, float('-inf'))
```

關係式找到後，就可以去思考遞迴關係式的終止條件了

題目的條件是需要把所有的工作都分配完，也就是說如果 `i` 已經和所有工作的陣列長度相等的時候，代表的就是所有的工作已經分配完了。

但是工作分配完後，還需要檢查還有沒有剩餘的天數沒有分配好，如果天數已經分配完了就達到了題目的要求，還沒有分配完的話，就沒有達到題目的要求。

這時候有另外一個需要思考的問題是，這些終止條件滿足時，回傳的值是什麼？

因為已經沒有工作要分配了，也沒有剩餘的天數要分配了，所以代表不會有新的工作量加入，但也不可能會減少工作量，這個時候工作的量就是 `0` ，但是如果還有 `k` 天還沒有分配完呢？這時候因為回傳的數值會和另一個選擇的路徑去做最小值的比較，因為沒有分配完的情況代表著這個情況並不可行，所以一定是要選擇另一條路走，既然要迫使選擇的是另一條路，在比較最小值的情況下，回傳一個無限大的值，就可以迫使程式選擇另一條路。

```python
class Solution:
    def minDifficulty(self, jobDifficulty: List[int], d: int) -> int:
        
        def helper(i, d, curr_max):
            # 所有任務都分配完了
            if i == len(jobDifficulty):
                # 所有的天數都分配完了
                if d == 0:
                    return 0
                # 尚有天數沒有分配到工作
                else:
                    return float('inf')
            
            # 當前最大值的取法，當前這個這個工作難度跟之前的最大工作難度來相比
            curr_max = max(curr_max, jobDifficulty[i])
            res = min(
                # 再多選一個工作，所以要把當前最大值繼續帶下去
                helper(i + 1, d, curr_max),
                # 選了足夠的工作進行一天的分配，進行下一輪的選擇工作，此時當前的最大值已經不重要了
                curr_max + helper(i + 1, d - 1, float('-inf'))
            )
            return res
        
        return helper(0, d, float('-inf'))
```

但是這還不是唯一的終止條件，還有一個終止條件是，如果已經沒有天數分配了怎麼辦？答案其實很簡單，只要回傳的值可以迫使程式選擇另外一條路就好。

```python
class Solution:
    def minDifficulty(self, jobDifficulty: List[int], d: int) -> int:
    
        def helper(i, d, curr_max):
            # 所有任務都分配完了
            if i == len(jobDifficulty):
                # 所有的天數都分配完了
                if d == 0:
                    return 0
                # 尚有天數沒有分配到工作
                else:
                    return float('inf')
            # 任務還沒分配完，但是已經沒有天數可以使用了
            if d == 0:
                return float('inf')
            
            # 當前最大值的取法，當前這個這個工作難度跟之前的最大工作難度來相比
            curr_max = max(curr_max, jobDifficulty[i])
            res = min(
                # 再多選一個工作，所以要把當前最大值繼續帶下去
                helper(i + 1, d, curr_max),
                # 選了足夠的工作進行一天的分配，進行下一輪的選擇工作，此時當前的最大值已經不重要了
                curr_max + helper(i + 1, d - 1, float('-inf'))
            )
            return res
        
        return helper(0, d, float('-inf'))
```

最後的最後還沒有完，那就是有一種可能是一開始天數就不夠分配所有的任務

```python
class Solution:
    def minDifficulty(self, jobDifficulty: List[int], d: int) -> int:
        if len(jobDifficulty) < d:
            return -1

        def helper(i, d, curr_max):
            # 所有任務都分配完了
            if i == len(jobDifficulty):
                # 所有的天數都分配完了
                if d == 0:
                    return 0
                # 尚有天數沒有分配到工作
                else:
                    return float('inf')
            # 任務還沒分配完，但是已經沒有天數可以使用了
            if d == 0:
                return float('inf')
            
            # 當前最大值的取法，當前這個這個工作難度跟之前的最大工作難度來相比
            curr_max = max(curr_max, jobDifficulty[i])
            res = min(
                # 再多選一個工作，所以要把當前最大值繼續帶下去
                helper(i + 1, d, curr_max),
                # 選了足夠的工作進行一天的分配，進行下一輪的選擇工作，此時當前的最大值已經不重要了
                curr_max + helper(i + 1, d - 1, float('-inf'))
            )
            return res
        
        return helper(0, d, float('-inf'))
```

上面的情況，我們很輕鬆地觀察出，一定會有存在重複的子問題，可以借用 Python 方便的語法來解決這個問題：

```python
class Solution:
    def minDifficulty(self, jobDifficulty: List[int], d: int) -> int:
        if len(jobDifficulty) < d:
            return -1

        @cache
        def helper(i, d, curr_max):
            # 所有任務都分配完了
            if i == len(jobDifficulty):
                # 所有的天數都分配完了
                if d == 0:
                    return 0
                # 尚有天數沒有分配到工作
                else:
                    return float('inf')
            # 任務還沒分配完，但是已經沒有天數可以使用了
            if d == 0:
                return float('inf')
            
            # 當前最大值的取法，當前這個這個工作難度跟之前的最大工作難度來相比
            curr_max = max(curr_max, jobDifficulty[i])
            res = min(
                # 再多選一個工作，所以要把當前最大值繼續帶下去
                helper(i + 1, d, curr_max),
                # 選了足夠的工作進行一天的分配，進行下一輪的選擇工作，此時當前的最大值已經不重要了
                curr_max + helper(i + 1, d - 1, float('-inf'))
            )
            return res
        
        return helper(0, d, float('-inf'))
```