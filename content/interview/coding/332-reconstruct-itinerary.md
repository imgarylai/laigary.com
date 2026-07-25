---
slug: "332-reconstruct-itinerary"
section: "coding"
title: "332. Reconstruct Itinerary"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674845029
updated_at: 1709273248
published_at: 1674845029
---
[332\. Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/)

這個題目算是面試題中，我覺得少數比較合理的難題。

題目是給定一組包含整趟旅程的機票，然後每次都是從 "JFK" 出發，要找出如何把機場代號依照字典序排列的方式，完成整趟旅程。

這個題目的第一直覺不會太難，可以透過遍歷的方式來來走完每個機場，但是困難的點是，一般的題目只要經過的點就可以不去探索，可是這個題目是可以的，例如，可能會有一段機票是要先由 A 飛到 B ，需要飛回 A 後再飛到下一個目的地，此時我們並不能把 A 因為已經探索過就標記起來，這樣的話 B 就飛不回 A 了。

但是題目其實有給定另外一個限制，這個限制才可以讓此題目有解，不然飛行計劃是有可能一直在繞圈圈的，那就是題目必定存在一個最佳路徑，也就是說雖然題目給機票的方式看似很隨機，但是我們可以不用擔心是否存在著最佳路徑，那就是從某個出發到到某個目的地的票的數量是固定的，例如：如果題目有著 A -> B 的票，且即使有著非常多張票，我們也不用擔心最佳路徑的問題，題目一定存在最佳路徑，我們只需要擔心有幾張票就好了。

最後一個只要擔心字典序的問題，這裡的做法也很簡單，就是把目的地先行排列好，永遠都從字典序最小的目的地先出發看看就知道了。

```python
class Solution:
    def findItinerary(self, tickets: List[List[str]]) -> List[str]:
        table = defaultdict(list)
        visited = defaultdict(int)
        for ticket in tickets:
            src = ticket[0]
            dst = ticket[1]
            table[src].append(dst)
            visited[(src, dst)] += 1
        for key, item in table.items():
            item.sort()

        numTickets = len(tickets) + 1

        res = []
        def backtrack(src, curr):
            if len(curr) == numTickets:
                res.append(list(curr))
                return True
            for idx, dst in enumerate(table[src]):
                if visited[(src, dst)] > 0 :
                    visited[(src, dst)] -= 1
                    ret = backtrack(dst, curr + [dst])
                    visited[(src, dst)] += 1
                    if ret:
                        return True

        backtrack('JFK', ['JFK'])
        return res[0]
```