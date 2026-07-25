---
slug: "301-remove-invalid-parentheses"
section: "coding"
title: "301. Remove Invalid Parentheses"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1764479181
updated_at: 1764479209
published_at: 1764479181
---
[301\. Remove Invalid Parentheses](https://leetcode.com/problems/remove-invalid-parentheses/)

```python
from typing import List

class Solution:
    def removeInvalidParentheses(self, s: str) -> List[str]:
        self.min_removed = float('inf')
        self.valid = set() 

        def backtrack(idx, left_count, right_count, curr, ignored):
            # [優化] 剪枝：如果目前刪除的數量已經超過已知最小值，就不用繼續了
            if ignored > self.min_removed:
                return

            if idx == len(s):
                if left_count == right_count:
                    # 找到更佳解：更新最小值，並重置結果集
                    if ignored < self.min_removed:
                        self.min_removed = ignored
                        self.valid = set()
                        self.valid.add("".join(curr))
                    # 找到同樣好的解：加入結果集
                    elif ignored == self.min_removed:
                        self.valid.add("".join(curr))
                return

            char = s[idx]

            # 情況 1: 不是括號，直接加入
            if char != '(' and char != ')':
                curr.append(char)
                backtrack(idx + 1, left_count, right_count, curr, ignored)
                curr.pop()
            else:
                # 情況 2: 是括號
                
                # 選項 A: 刪除 (Ignore) 這個括號
                backtrack(idx + 1, left_count, right_count, curr, ignored + 1)

                # 選項 B: 保留 (Keep) 這個括號
                curr.append(char)
                if char == '(':
                    backtrack(idx + 1, left_count + 1, right_count, curr, ignored)
                elif right_count < left_count:
                    # 只有在右括號數量小於左括號時，才能加入右括號 (剪枝無效狀態)
                    backtrack(idx + 1, left_count, right_count + 1, curr, ignored)
                
                curr.pop()

        backtrack(0, 0, 0, [], 0)
        return list(self.valid)
```