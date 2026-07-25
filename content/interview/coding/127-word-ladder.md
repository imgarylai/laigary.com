---
slug: "127-word-ladder"
section: "coding"
title: "127. Word Ladder"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973110
updated_at: 1761436740
published_at: 1674973110
---
[127\. Word Ladder](https://leetcode.com/problems/word-ladder/)

第一個要處理的是，首先每個字都可以有一個字的轉換，所以最好的方式是我們把類似的字都先分類在一起，例如：`hit, hot` ，這兩個字如果中間用星號取代，就可以分類成：`{ h*t: [hit, hot]}` 這樣的字典表。

Python 沒有直接把字串中某個位置的字元取代掉的 API ，所以要自己寫一個，[參考資料](https://stackoverflow.com/a/41752999/1278390)。

```python
def maskWord(word, i=0):
    return word[:i] + '*' + word[i+1:]

```

在這個題目裡面，我們的目標是不斷的替換字元，進而從起始字元走到最終字元，所以字元的長度一定要是一樣的，如果不一樣的話，就一定換不到。

所以我們可以利用 `beginWord` 、`endWord` 任意一個字元先取出這個題目的目標字串的長度為何，接著透過 index 的方式，將所有的字元分類好，這裡的 Table 可以說是一個圖，或是一個樹都可以。

```python
L = len(beginWord)

def maskWord(word, i=0):
    return word[:i] + '*' + word[i+1:]

table = defaultdict(list)
for i in range(L):
    for word in wordList:
        table[maskWord(word, i)].append(word)

```

接下來就是看從起點出發（`beginWord`），看看能不能走到 `endWord` ，既然要找的是最短路徑，那就會使用廣度優先搜索來找。

其中要記得，已經走過的路（使用過的字）要記錄起來，如果可以走得到終點，就回傳走了幾層，如果走不到，且都探索完了，就回傳 0 。

```python
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        if endWord not in wordList or not beginWord or not endWord or not wordList:
            return 0

        def maskWord(word, i=0):
            return word[:i] + '*' + word[i+1:]

        L = len(beginWord)
        table = defaultdict(set)

        for i in range(L):
            for word in wordList:
                table[maskWord(word, i)].add(word)

        seen = set()
        queue = deque()
        level = 0
        queue.append(beginWord)
        seen.add(beginWord)
        while queue:
            size = len(queue)
            level += 1
            for i in range(size):
                node = queue.popleft()
                if node == endWord:
                    return level
                for j in range(L):
                    for word in table[maskWord(node, j)]:
                        if word not in seen:
                            queue.append(word)
                            seen.add(word)
        return 0

```

這個題目的難點並不在於程式碼，在於是否可以用適當的資料結構來存儲必要的資訊。