---
slug: "1166-design-file-system"
section: "coding"
title: "1166. Design File System"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1746409358
updated_at: 1746410028
published_at: 1746409358
---
[1166\. Design File System](https://leetcode.com/problems/design-file-system/)

這個題目滿好想到使用 [Trie](/interview/coding?tag=Trie) 的方式來實作的，不過邏輯上要注意幾點

1.  要如何確保 `createPath` 時，parent 的路徑存在？
2.  要如何確保 `createPath` 時，該路徑是否存在？

這兩個條件需要依靠第一個迴圈中的第一個條件判斷式來做到，這裡的邏輯判斷是這樣的：

開始遍歷每個資料夾的結構，如果說這個資料夾結構的其中一個路徑不存在，代表的是其 parent 的路徑並不存在，直接回傳 False 。

但是如果遍歷到最後一個資料夾路徑的時候，我們要做一個額外的判斷

1.  如果該路徑不存在，代表的是可以建立此資料夾 -> 資料夾已經建立，但是數值還沒有儲存。
2.  如果該路徑存在了，代表的是該資料夾已經建立過了，但是迴圈這時候也結束了。

雖然這個時候迴圈也結束了，但是我們有一個條件可以判斷該路徑是否存在，因為如果是剛建立好的資料夾，數值尚未儲存，因次如果數值已經被儲存了，代表我們建立了一個相同的路徑，回傳 False。

反之，如果數值不存在，代表這是第一次建立，這時候我們可以把數值儲存起來，並且回傳 True 。

```python
class FileSystem:

    def __init__(self):
        self.trie = defaultdict(dict)
        
    def createPath(self, path: str, value: int) -> bool:
        components = path.split("/")

        cur = self.trie

        for i in range(1, len(components)):
            name = components[i]
            if name not in cur:
                if i == len(components) - 1:
                    cur[name] = defaultdict(dict)
                else:
                    return False
            cur = cur[name]
        if '#' in cur:
            return False
        
        cur['#'] = value
        return True

    def get(self, path: str) -> int:
        components = path.split("/")

        cur = self.trie

        for i in range(1, len(components)):
            
            # For each component, we check if it exists in the current node's dictionary.
            name = components[i]
            if name not in cur:
                return -1
            cur = cur[name]
        return cur['#'] if '#' in cur else -1
        


# Your FileSystem object will be instantiated and called as such:
# obj = FileSystem()
# param_1 = obj.createPath(path,value)
# param_2 = obj.get(path)
```