---
slug: "1610-maximum-number-of-visible-points"
section: "coding"
title: "1610. Maximum Number of Visible Points"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1762126994
updated_at: 1762143790
published_at: 1762126994
---
[1610\. Maximum Number of Visible Points](https://leetcode.com/problems/maximum-number-of-visible-points/)

```python
class Solution:
    def visiblePoints(self, points: List[List[int]], angle: int, location: List[int]) -> int:
        
        x0, y0 = location
        angles = []
        same = 0

        for x, y in points:
            dx, dy = x - x0, y - y0
            if dx == 0 and dy == 0:
                same += 1
                continue
            deg = math.degrees(math.atan2(dy, dx))
            angles.append(deg)
        
        angles.sort()

        extended = angles + [a + 360 for a in angles]

        counts = 0
        slow = 0
        fast = 0

        while slow < len(angles):
            while fast < len(extended) and extended[fast] - extended[slow] <= angle:
                fast += 1
            counts = max(counts, fast - slow)
            slow += 1
        
        return counts + same
```

這個題目基本上屬於沒有寫過面試寫不太出來的問題，如果面試真的遇到這個題目，我是覺得這間公司基本上已經不想收人了...

題目的敘述很複雜，並且給出的例子並不是非常的好做推演，又題目給出一開始面向右側這個條件其實滿誤導人的，所以我花了時間重新理解了一下題目。

透過題目的例子，其實題目要找的就是在一個視角內，最多可以一次看到多少個目標，我們要怎麼樣知道一次最多可以看到幾個座標點呢？如果用圖形的角度來看的確是很簡單，首先我們可視範圍先對齊一個點，接著以自身為圓心，往左劃圓直到可視範圍角度的極限，以這個邏輯結構來看，我們會需要兩個參照座標，用來移動並更新可是範圍內的所有座標，就可以視題目為 [Two Pointers](/interview/coding?tag=Two%20Pointers) 雙指針的題目，但是困難的點是，多數的雙指針都是在線性的平面上面，可是這一題卻是在一個圓形/扇形的平面裡面。

所以第一步會是需要座標的轉換，這是一個在 LeetCode 裡面非常少用的 API ，這個 API 是 `math.atan2()` （[反正切函數](https://zh.wikipedia.org/wiki/Atan2)），除非日常工作是做影像視覺處理，不然這是一個日常軟體開發上很少用到的 API ，好心一點就是面試官會給你這個 API 然後告訴你他的意義是什麼。

畢竟這是一個三角函數，所以面試官就算告訴你意義後，也還需可以快速回憶起腦中對於三角函數的一些概念，不然接下來的邏輯也像是瞎子摸象，這裡簡單地說，就是要找出兩個點相對於水平線的夾角，並且帶著正負值所以我們才能知道象限。

第一個部分，就是把所在位置與每個點的相對角度都找出來。

第二個部分，也是非常難想到的地方，這是一個 edge case 需要處理，那就是給的座標點清單中，會有可能這些點，和我們的起點相同，這種情況下，因為我們的座標重複，並不需要旋轉就可以看得到，所以如果有座標跟我們所在的座標相同的情況下，我們要記錄成一定可以看到的座標點。

座標的預處理就這樣結束了，接著是這個題目的第三個難點，那就是前面的座標轉換，會把座標處理在 0 ~ 360 之間，如果我現在視角最右側邊界有一個點，是在 350 度角的地方，我的視角是 30 度，那我能看到的視角應該可以從 350 度一直到 380 度，換句話說也是正 20 度，這樣就可能會造成一一下左側視角範圍內的點我們沒有計算到。

第三個部分，就是要處理上述的情況，這裡處理的方式就是我們把每個點都「多轉一圈」，在多轉一圈之前，還要先把每個角度從小到大排序好，這樣我們在轉動視角的時候，才可以確定相近角度的點都會一起被考慮到。

這三個部分處理完後，我們會得到

1.  哪些和原點重複的座標
2.  在座標平面上，每一個點其相對於原點的角度。

一直到這裡，才會是題目解題的雙指針題目的核心：

```python
        counts = 0
        slow = 0
        fast = 0

        while slow < len(angles):
            while fast < len(extended) and extended[fast] - extended[slow] <= angle:
                fast += 1
            counts = max(counts, fast - slow)
            slow += 1
        
        return counts + same
```

這裡有另一個容易卡住的點，那就是雙指針的問題，這裡的快慢指針要怎麼處理，如同前面一開始所提，我們是定好一個位置後，接著開始展開視角直到極限為止，因次展開的時候是快指針去走。

另外一個點是，快指針在慢指針移動的時候，是否要重新從慢指針開始出發？答案是不用的。

1.  如果快指針所指向的位置，在接下來個幾個慢指針前進的時候，都無法向前，那慢指針就會持續前進，這並不影響現階段的技術。
2.  如果快指針可以繼續走，那當下慢指針跟快指針的距離可以更大，代表有更多的座標可以被加入，這樣也是可行的。

時間複雜度是 $O(nlog(n))$，最主要是排序的地方。