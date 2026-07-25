---
slug: "55-jump-game"
section: "coding"
title: "55. Jump Game"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944457
updated_at: 1765260998
published_at: 1674944457
---
[55\. Jump Game](https://leetcode.com/problems/jump-game/)

從起點開始，看有哪些座標可以去，選定一個座標後繼續走下去，看看能不能到達終點（超時）

```python
class Solution:
    def canJump(self, nums: List[int]) -> bool:
        
        @cache
        def dp(i):
            if i == len(nums) - 1:
                return True
            for j in range(i + 1, min(i + nums[i] + 1, len(nums))):
                if dp(j):
                    return True
            return False
        
        return dp(0)
```

上面這個方法存在著一個小地方可以優化，那就是每一次我們要走的時候，都應該要先朝能走得最遠的方向去探索，但是理論的時間複雜度還沒有被優化。

```python
class Solution:
    def canJump(self, nums: List[int]) -> bool:    
        def traverse(i):
            if i == len(nums) - 1:
                return True
            farestPosition = min(i + nums[i] + 1, len(nums))
            for j in reversed(range(i+1, farestPosition)):
                if traverse(j):
                    return True
            return False
        return traverse(0)
```

上面的解法存在這一個問題，那就是在探索的路程中，有些節點可能會一直不斷的重複探索，像是題目中的第二個範例，第一開始的起點探索完之後，我們其實早就知道座標 1, 2 怎麼走都會走到零，當我們再一次走到 2 的時候，應該就要直接知道不要再去走了。

```text
[3,2,1,0,4]
```

## 動態規劃

所以我們需要記錄座標是不是走過了，但是如果說我們只記錄座標是不是走過了，是不是還少了點什麼？因為一個走過的座標，還要去考量他是不是有用的座標能夠幫我們繼續往下走。

這樣看起來好像有四個狀態：走過 vs 沒有走過和有用 vs 沒有用。不過事實上只有三種，因為沒有走過的座標，我們一定不知道有沒有用，只有走過的座標才會知道有用或是沒有用，所以如果知道一個座標是有用或是沒有用的話，我們就知道這個座標一定是走過的。

這個觀念有了後，就可以建立一個表幫助我們記錄走過的路徑，這個表需要的記憶體看陣列的大小，一開始都是沒有造訪過的，用 None 來表示。那最後一個點一定是有用的，因為那是我們的終點，所以先將其記錄成有用的。

```python
memo = [None] * len(nums)
memo[-1] = True
```

至此，我們就完成了時間複雜度在 $O(n^2)$ 的解法。

```python
class Solution:
    def canJump(self, nums: List[int]) -> bool:
        memo = [None] * len(nums)
        memo[-1] = True
        def traverse(i):
            # 如果我們已經知道此點是造訪過的，那我們就直接回傳結果
            # 不用再判斷 i 是否等於 len(nums) - 1 是因為初始化
            # 時，已經將結果存入了。
            if memo[i] is not None:
                return memo[i]
            farestPosition = min(i + nums[i] + 1, len(nums))
            for j in reversed(range(i+1, farestPosition)):
                if traverse(j):
                    # 更新這個點有助於往前
                    memo[i] = True
                    return memo[i]
            # 如果上面的路都沒有幫助，那這個點就是沒有意義的點。
            memo[i] = False
            return memo[i]
        return traverse(0)
```