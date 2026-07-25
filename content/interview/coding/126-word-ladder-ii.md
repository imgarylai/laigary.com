---
slug: "126-word-ladder-ii"
section: "coding"
title: "126. Word Ladder II"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973109
updated_at: 1674973109
published_at: 1674973109
---
[126\. Word Ladder II](https://leetcode.com/problems/word-ladder-ii/)

做這一題之前要先了解 [127\. Word Ladder](/interview/coding/127-word-ladder) 。這一題稍微不一樣的是，我們要舉出所有的路徑。

這一個題目需要注意的是，廣度優先搜索一定要一層一層的搜索，不能一步一步的搜索，因為當我們找到答案的同時，掃瞄完該層時，就會有所有的組合了，可以快速的找到答案，但如果是一步一步走，那就會變成要窮舉完，後面的探索都是無效的。

比較特別的是這裡和回溯法有一點點類似的地方，那就是既然是一層一層走，一個單字在該層都算是可以使用的，因此在記錄已經造訪過的點的方法，要用 union set 的方式紀錄（這是一個比較少用的 API)。但是不記得此 API 也沒關係，可以透過一個迴圈再把所有的 word 加進去。

```python
class Solution:
    def findLadders(self, beginWord: str, endWord: str, wordList: List[str]) -> List[List[str]]:
        if endWord not in wordList or not beginWord or not endWord or not wordList:
            return []

        def maskWord(word, i=0):
            return word[:i] + '*' + word[i+1:]

        L = len(beginWord)
        table = defaultdict(list)

        for i in range(L):
            for word in wordList:
                table[maskWord(word, i)].append(word)

        q = deque([(beginWord, [beginWord])])
        seen = set([beginWord])
        ans = []

        while q:
            size = len(q)
            local = set()
            for i in range(size):
                word, path = q.popleft()
                for j in range(L):
                    for next_word in table[maskWord(word, j)]:
                        if next_word == endWord:
                            ans.append(list(path + [next_word]))
                        if next_word not in seen:
                            q.append((next_word, path + [next_word]))
                            local.add(next_word)
            if ans:
                break
            seen = seen.union(local)
        return ans

```