---
slug: "heap-topk-template"
section: "coding"
title: "Heap / Top K 模板"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
看到「第 k 大 / 前 k 個 / 資料流中動態取極值」就是 heap。Python 的 `heapq` **只有最小堆**，這是所有寫法差異的來源。

```python
import heapq

heap = []
heapq.heappush(heap, x)      # O(log n)
smallest = heapq.heappop(heap)
smallest = heap[0]           # 看一眼不取出，O(1)
heapq.heapify(nums)          # 原地建堆，O(n) — 比逐個 push 快
```

## 第 k 大：維持一個大小為 k 的最小堆

直覺會想用最大堆取 k 次，但**維持一個 size k 的最小堆更好** — 堆頂永遠是「目前的第 k 大」，空間 $O(k)$ 而不是 $O(n)$：

```python
def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)      # 擠掉最小的，留下最大的 k 個
    return heap[0]
```

複雜度 $O(n \log k)$。資料流題目（無限輸入）只能這樣做 — 這也是為什麼面試官愛考。

例題：[215. Kth Largest Element in an Array](/interview/coding/215-kth-largest-element-in-an-array)、[703. Kth Largest Element in a Stream](/interview/coding/703-kth-largest-element-in-a-stream)

## 要最大堆？取負數

```python
heapq.heappush(heap, -x)
largest = -heapq.heappop(heap)
```

排序依據不是元素本身時，push **tuple**，第一個元素就是排序鍵：

```python
heapq.heappush(heap, (dist, point))       # 依 dist 排序
heapq.heappush(heap, (-count, word))      # 次數大的優先，同次數字典序小的優先
```

tuple 相等時會比較第二個元素，所以第二個元素必須可比較 — 放物件會炸，這時塞一個遞增的計數器當 tie-breaker。

例題：[347. Top K Frequent Elements](/interview/coding/347-top-k-frequent-elements)、[973. K Closest Points to Origin](/interview/coding/973-k-closest-points-to-origin)

## 多路合併：堆裡放「每一路的當前元素」

k 個有序序列合併時，堆的大小是 k（不是總元素數），每次取出最小的，再把那一路的下一個補進來：

```python
heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
heapq.heapify(heap)
while heap:
    val, i, j = heapq.heappop(heap)
    res.append(val)
    if j + 1 < len(lists[i]):
        heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
```

例題：[23. Merge k Sorted Lists](/interview/coding/23-merge-k-sorted-lists)、[Kth Smallest Element in a Sorted Matrix](/interview/coding/kth-smallest-element-in-a-sorted-matrix)

## 雙堆：動態取中位數

用一個最大堆存左半（較小的一半）、一個最小堆存右半，維持兩堆大小差 ≤ 1，中位數就在堆頂：

```python
# small 是最大堆（存負數），large 是最小堆
heapq.heappush(small, -heapq.heappushpop(large, x))
if len(small) > len(large):
    heapq.heappush(large, -heapq.heappop(small))
```

`heappushpop` 一步完成「推入再彈出」，比分兩步快也比較不會寫錯。

例題：[295. Find Median from Data Stream](/interview/coding/295-find-median-from-data-stream)

## 什麼時候不該用 heap

只需要一次性拿前 k 個而且 k 接近 n 時，直接排序 $O(n \log n)$ 更簡單；要求 $O(n)$ 平均時間找第 k 大，正解是 quickselect 而不是 heap。面試時能主動比較這三種（排序 / heap / quickselect）的取捨，比只寫出 heap 版本強得多。

更多題目 → [#Heap](/interview/coding?tag=Heap)
