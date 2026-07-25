---
slug: "937-reorder-data-in-log-files"
section: "coding"
title: "937. Reorder Data in Log Files"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[937\. Reorder Data in Log Files](https://leetcode.com/problems/reorder-data-in-log-files/)

自定義排序

1.  如果第一個字是文字，有比較高的優先級，再以內容以字典序排列，如果內容的字典序相同，以識別碼的字典旭排序
2.  如果內容的第一的字是數字，為次之，則按照一般數字排列的方式排列。

```python
class Solution:
    def reorderLogFiles(self, logs: List[str]) -> List[str]:
        def key(log):
            identifier, content = log.split(' ', 1)
            return (0, content, identifier) if content[0].isalpha() else (1, )

        return sorted(logs, key=key)

```