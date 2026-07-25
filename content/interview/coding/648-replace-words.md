---
slug: "648-replace-words"
section: "coding"
title: "648. Replace Words"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1674972896
updated_at: 1674972896
published_at: 1674972896
---
[648\. Replace Words](https://leetcode.com/problems/replace-words/)

這一題就屬於一開始看題目比較不容易看出來要是用 `Trie` ，題目中的一個小提示是最後我們要輸出的字串，是要輸出的是每個單字的 `prefix` ，看到要找 `prefix` 後，就可以考慮看看是不是可以用 `Trie` 來寫。

一開始提到，在 `Trie` 的問題中，我們很常會需要在節點上面儲存額外的資訊，想是在這個題目裡面，在 `Trie` 處理一連串來自字典的文字時，很常用到的一個技巧是要記錄字串的節點位置，`Trie` 有個致命的缺點就是我可以確定這個字串存不存在，可是要還原整個字串並不容易，在這個題目裡面，我直接設立了一個終點的符號 `$` 並且把該符號當作 `key` ，再把字當作 `value` 存入。

這樣的話當我找到這個字元的時候，我就可以直接找到答案，不用再重新遍歷一次。

```python
class Solution:
    def replaceWords(self, dictionary: List[str], sentence: str) -> str:
        trie = {}
        for word in dictionary:
            node = trie
            for char in word:
                if char not in node:
                    node[char] = {}
                node = node[char]
            node['$'] = word
        ans = []
        for word in sentence.split():
            node = trie
            for char in word:
                if char in node:
                    node = node[char]
                    # 題目有要求，如果有更短的 prefix ，要選擇該字
                    if '$' in node:
                        break
                else:
                    # 題目可能有符合一些 prefix 中的部分 prefix 
                    # 但是沒有完全符合，所以我們直接終結。
                    break
            if '$' in node:
                ans.append(node['$'])
            else:
                ans.append(word)
        return ' '.join(ans)

```