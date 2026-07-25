---
slug: "40-combination-sum-ii"
section: "coding"
title: "40. Combination Sum II"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844309
updated_at: 1723096356
published_at: 1674844309
---
[40\. Combination Sum II](https://leetcode.com/problems/combination-sum-ii/)

這題是以下兩題的總和：

1.  像是 [90\. Subsets II](/interview/coding/90-subsets-ii) 一樣，如果有重複的答案我們不要。
2.  和 [39\. Combination Sum](/interview/coding/39-combination-sum) 不同，每一個數字有使用的上限。

```python
class Solution:
    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:
        ans = []
        candidates.sort()
        def backtrack(curr, target, start, counter):
            if target == 0:
                ans.append(list(curr))
                return
            elif target < 0:
                return
            else:
                for i in range(start, len(candidates)):
                    if i > start and candidates[i] == candidates[i -1]:
                        continue
                    curr.append(candidates[i])
                    counter[candidates[i]] -= 1
                    backtrack(curr, target - candidates[i], i + 1, counter)
                    counter[candidates[i]] += 1
                    curr.pop()

        backtrack([], target, 0, Counter(candidates))
        return ans
```