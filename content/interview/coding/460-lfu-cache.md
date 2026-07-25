---
slug: "460-lfu-cache"
section: "coding"
title: "460. LFU Cache"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1675098624
published_at: 1674973113
---
[460\. LFU Cache](https://leetcode.com/problems/lfu-cache/)

LFU 則是另外一個快取機制，主要是讓越常被存取的資料更快地取出，並包含 LRU 的機制，如果超過限制的資源，把最少用掉的刪掉，如果最少用到的資料取出的頻率相同時，則優先刪除更早以前的資料。

所以我們至少需要知道的東西有兩件

1.  每筆資料分別的使用頻率
2.  每筆資料分別進入的順序（當遇上同樣頻率時，選擇哪個要優先刪除）

所以最少我們需要的有兩樣東西，第一個是 `key_to_freq` 這用來記錄每一個資料的頻率，至於順序重不重要呢？這裡只要知道每一個鍵值的頻率即可，所以順序是不重要的，所以用一般的 Hash Table 就好了。

第二個是 `freq_to_keys` ，這裡需要花一點時間理解，我們需要紀錄每一種頻率，各有哪幾筆資料被送進來過，如果是一個陣列的話足夠嗎？應該不足夠，舉例來說，如果我們呼叫一次 `get` 而要造訪的資料在中間的話，我們還需要有另一個 Hash Table 來記錄去紀錄每個位置，不然的話沒辦法記錄著位子，但是光是這樣還不夠，我們還有數值要儲存，所以 LRU 利用到的 Doubly Linked List + Hash Map 在這裡就可以用得到了。這裡為了方便，就直接使用了 `OrderedDict` 來記錄。

這個`freq_to_keys` 的結構會像是這樣：

```javascript
{
    # 頻率
    1: {
        # 這裡面是有序的排列
        # 鍵值：數值
        3: 4
        2: 1
    }
}

```

新增資料時，如果資料沒有存在過其實還算簡單，這題目難是難在新增資料時資料已經存在，以及查詢資料時，因為我們需要更新這筆資料的造訪頻率以及排序好這筆資料的位置（移動到最後）

使用的方式如下，每次查找資料的時候先從`key_to_freq` 找到這個鍵的頻率 ，然後該利用該頻率和鍵值於 `freq_to_keys` 找資料，找到然後該筆資料會是一個 `OrderedDict` ，我們此時就可以找到該值的數值 。

```python
class LFUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.key_to_freq = collections.defaultdict()
        self.freq_to_keys = collections.defaultdict(collections.OrderedDict)
        self.minfreq = 0

```
```python
class LFUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.keyToFreq = {}
        self.freqAndKeyToVal = defaultdict(OrderedDict)
        self.minFreq = 0

    def get(self, key: int) -> int:
        if key not in self.keyToFreq:
            return -1
        else:
            freq = self.keyToFreq[key]
            val = self.freqAndKeyToVal[freq][key]
            del self.freqAndKeyToVal[freq][key]
            if not self.freqAndKeyToVal[freq]:
                del self.freqAndKeyToVal[freq]
                if freq == self.minFreq:
                    self.minFreq += 1
            self.keyToFreq[key] = freq + 1
            self.freqAndKeyToVal[freq + 1][key] = val
            return val

    def put(self, key: int, value: int) -> None:
        if self.capacity <= 0: return None
        if key in self.keyToFreq:
            freq = self.keyToFreq[key]
            self.freqAndKeyToVal[freq][key] = value
            self.get(key)
        else:
            if len(self.keyToFreq) == self.capacity:
                delKey, delVal = self.freqAndKeyToVal[self.minFreq].popitem(last=False)
                del self.keyToFreq[delKey]
            self.minFreq = 1                
            self.keyToFreq[key] = self.minFreq
            self.freqAndKeyToVal[self.minFreq][key] = value

```