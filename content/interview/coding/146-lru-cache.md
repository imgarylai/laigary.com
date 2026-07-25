---
slug: "146-lru-cache"
section: "coding"
title: "146. LRU Cache"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1675042077
published_at: 1674973128
---
[146\. LRU Cache](https://leetcode.com/problems/lru-cache/)

LRU Cache 這是一題經典題型，完全沒有概念的讀者我會建議一開始直接先看解答，懂概念後再做也沒關係的題目，因為這道題目的原理並不難，不如先把所有的東西都先搞定，面試前做熟就好了，因為就算知道原理，在真正要寫出程式的時候太多細節需要要求了，而且就算面試中面試官跟你講解了 LRU 快取的概念，沒有看過做法，真的很難做出來。

LRU Cache 個這裡一開始我就打算直接破題，這個題目的敘述可以直接到 LeetCode 上面看。

如果這輩子從來沒有寫過 LRU Cache 尤其大學不是念資工系的學生（像是我），極少數人應該可以在 45 分鐘內想到這題目需要用到 Doubly Linked List + Hash Table 。就算是上課有提到，我想教授應該也會直接跟大家講這個題目的核心觀念，不用太折騰自己要在 45 分鐘想出並寫完。

## 為何需要 Doubly Linked List ？

Doubly Linked List 可以幫我們做兩件事情，在 $O(1)$ 的時間複雜度的情況下，在**新增、刪除、查看**後的情況下，不斷地幫我們保持最後一次使用到的資料在這筆資料的最尾端。

那為什麼需要雙向？因為我們在新增、刪除節點的時候，我們才能知道該節點的前一個節點的資訊，確保操作可以在時間複雜度 $O(1)$。

## 為何需要 Hash Map ？

Linked List 並不像陣列一樣可以靠位置來快速定位到我們想要的元素，所以我們需要 Hash Map ，當我們用某個 key 值來搜尋時，快速定位到 Linked List 上節點的位置。這個概念在 Clone 複製圖形的系列問題裡面有用到。

## 實作

這題目其實是難在懂了原理後要怎麼樣把細節都做出來。前面有說此題目需要 Doubly Linked List ，但是 LeetCode 上面的答案其實省略了這一個部分，我覺得其實把 Doubly Linked List 獨立寫出來並不會多花太多時間，但是會比 LeetCode 上面的答案更容易理解。

### Doubly Linked List

他的資料結構並不難，我們需要兩個指針 `head` 和 `tail` 來形成一個雙向指標結構的區間，並且記錄我們目前的資料長度為多少（size）。

而這個題目的特性，我們只要完成三個功能就好

1.  當新增、查詢的時候，都要將該筆資料移動到最後的 `add_to_last` 。
2.  移除節點 `remove_node` 。
3.  透過移除節點移除第一個節點 `remode_first_node`，這是當資料的數量超過限制的空間時，需要的操作。

```python
class Node:
    def __init__(self, key: int, val: int):
        self.key = key
        self.val = val
        self.next = None
        self.prev = None

class DLinkedList:
    def __init__(self):
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head
        self.size = 0

    def add_to_last(self, node: Node) -> None:
        node.next = self.tail
        node.prev = self.tail.prev
        self.tail.prev.next = node
        self.tail.prev = node
        self.size += 1

    def remove_node(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev
        self.size -= 1

    def remove_frist(self) -> Node:
        if self.head.next == self.tail:
            return None
        first = self.head.next
        self.remove_node(first)
        return first

```
```python
class LRUCache:

    def __init__(self, capacity: int):
        self.cache = DLinkedList()
        self.capacity = capacity
        self.table = {}

    def mark_recent_node(self, key: int) -> None:
        node = self.table[key]
        self.cache.remove_node(node)
        self.cache.add_to_last(node)

    def add_most_recent_node(self, key, val: int) -> None:
        node = Node(key, val)
        self.cache.add_to_last(node)
        self.table[key] = node

    def delete_key(self, key: int) -> None:
        node = self.table[key]
        self.cache.remove_node(node)
        del self.table[key]

    def remove_least_recent_used_node(self) -> None:
        first = self.cache.remove_frist()
        del self.table[first.key]

    def get(self, key: int) -> int:
        if key not in self.table:
            return -1
        self.mark_recent_node(key)
        return self.table[key].val

    def put(self, key: int, value: int) -> None:
        if key in self.table:
            self.delete_key(key)
            self.add_most_recent_node(key, value)
            return
        if self.capacity == self.cache.size:
            self.remove_least_recent_used_node()
        self.add_most_recent_node(key, value)

```

## 總結

不知道你同不同意，我前面有說到完全沒有聽過 LRU Cache 的話，很難想得到它的實作細節，但是其實在 Python 裡面有一個內建的方法很簡單，他可以快速的幫你做出 Doubly Linked List + Hash Map 的功能，那就是 `OrderedDict()` 這是一個有序的 `dict` 。

```python
from collections import OrderDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def move_to_end(self, key: int) -> None:
        val = self.cache[key]
        del self.cache[key]
        self.cache[key] = val

    def get(self, key: int) -> int:
        if key in self.cache:
            # L11-L13 的操作在於要把元素放到最後
            self.move_to_end(key)
            return val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last = False)

```

而如果熟悉他的 API 的話，OrderDict 內建一個函式叫做 `move_to_end`於是可以改寫成：

```python
class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        else:
            self.cache.move_to_end(key)
            return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.get(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

```