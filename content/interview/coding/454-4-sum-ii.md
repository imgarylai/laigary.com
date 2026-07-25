---
slug: "454-4-sum-ii"
section: "coding"
title: "454. 4 Sum II"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973111
updated_at: 1686112172
published_at: 1674973111
---
[454\. 4 Sum II](https://leetcode.com/problems/4sum-ii/)

這一個題目的設計比較特別一點，給出四個長度一樣的陣列，要從四個陣列中挑出任意四個數字，其總和為零。

這個題目存在著暴力解，那就是四個陣列一個一個掃描，這樣的時間複雜度會是 $O(n^4)$ 如果說每個陣列的長度為 $n$ 。

不過這一個題目如果用 n Sum 的思想來想的話，其實存在著另外一個解法，那就是如果我從前面兩個陣列，各挑出一個數字後，其總和如果是 $k$  ，那我只要再另外兩個陣列，找出總和為 $-k$  的組合即可。

有一件事情要注意的是，從前面兩個陣列隨機挑選兩的個數字，其總和為 $k$ 的情況其實有很多種，假設有 $x$  種，那後面兩個陣列每次找出總和為 $-k$ 的情況，就可以組合出 $x$ 種組合。

因此在計算答案時，要記得累加可以組合的情況。

這​樣的方式時間複雜度可以降低到只要在 $O(n^2) $ 。

```python
class Solution:
    def fourSumCount(self, nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:
        target = 0
        table = defaultdict(int)
        ans = 0
        for num1 in nums1:
            for num2 in nums2:
                s = num1 + num2
                table[s] = table[s] + 1

        for num3 in nums3:
            for num4 in nums4:
                s = num3 + num4
                if target - s in table:
                    ans += table[target-s]
        return ans

```