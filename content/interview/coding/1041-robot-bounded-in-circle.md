---
slug: "1041-robot-bounded-in-circle"
section: "coding"
title: "1041. Robot Bounded In Circle"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1675098543
published_at: 1674973128
---
題目是給定機器人一串字串，裡面包含了前進、右轉、左轉這三種指令。題目問說，如果持續給這個機器人一樣的指令很多次，機器人是否會回到原點？

這題一開始我的直覺法是遞迴或是回朔的想法來解，因為我們需要機器人一直探索，一般來說如果要做遞迴或是回溯的題型，會很明確的定義出終止條件（Base case），還有動態轉移方程的變數，但是根據題目所寫，我們的目的是要機器人可以回到原點，回到原點就是我們的中止條件，但是要怎麼遞迴，其實我是想不出來的，因為看到題目的範例中，有指令走一次就回到原點了，也有走四次才回到原點。那到底走幾次能會到原點，一般來說遞迴的題目會有個 n 來方便我們慢慢一層一層地走下去，做為窮舉的最大上限，但是這題乍看之下還真的不知道，我們也不可能設定一個超大的 n 不斷地走看看到底有沒有中間會回到原點的情況。

其實我覺得這種題目比起出在 online assement ，應該更適合出在現實生活的白板題，因為我真的想破頭想不到要怎麼寫，所以自己想辦法出了幾個可以回到原點的指令（想到這個指令其實也很難）慢慢的在紙上畫出，**才觀察出「好像」可以走回原點的指令**，都在執行最多四次後就一定會回來！（希望看到這篇沒有想出來的人，可以因為看到這篇而對自己更有自信一點）但是我真的不知道怎麼證明這個猜想是對的，而且我花了很多時間在畫圖觀察，所以我就直接寫了一個很白癡的程式，試試看能不能通過，結果沒想到，還真的通過了！

邏輯很簡單，我設定一開始的出發點是原點，設定一開始面朝北方，遇到 R 或 L 就左右轉方向，遇上 G 就前行，並更新自己的座標，然後把指令執行四次，最後如果回到原點，就代表指令是可以讓機器人回來的。

```python
class Solution:
    def isRobotBounded(self, instructions: str) -> bool:
        coordinate = (0, 0)
        direction = (0, 1)
        for i in range(4):
            for instruction in instructions:
                if instruction == 'R':
                    if direction == (0, 1):
                        direction = (1, 0)
                    elif direction == (1, 0):
                        direction = (0, -1)
                    elif direction == (0, -1):
                        direction = (-1, 0)
                    elif direction == (-1, 0):
                        direction = (0, 1)
                if instruction == 'L':
                    if direction == (0, 1):
                        direction = (-1, 0)
                    elif direction == (-1, 0):
                        direction = (0, -1)
                    elif direction == (0, -1):
                        direction = (1, 0)
                    elif direction == (1, 0):
                        direction = (0, 1)
                if instruction == 'G':
                    coordinate = (coordinate[0] + direction[0], coordinate[1] + direction[1])
        return coordinate == (0, 0)

```

事後我才知道，原來這個題目是可以被證明，真的最多只要執行四次，就可確認機器人會不會回到原點，但是要在這的短的時間內想完證明，是真的有點難，所以我把這題放在特殊題型，當看過這個題目後，可以先花時間理解如何證明此題目的觀察，當知道證明的結果，在真正面試時可以花更多的時間去構思該如何寫出程式碼。

## 重構程式碼（增加閱讀性）

第一個部分我會建議把決定機器人方向的部分先行重構，將方向整理成如下：

```python
directions = [(0,1), (1,0), (0,-1), (-1, 0)]
# 上、右、下、左

```

接下來是處理左轉、右轉的情況，會需要一個計數器指針來紀錄目前走的情況，這個計數器的邏輯很簡單，右轉一次計數器加一，左轉一次計數器減一，並且每次取除四的餘數，確保這個計數器指針不會超過範圍。

```python
if i == "L":
    idx = (idx - 1) % 4
elif i == "R":
    idx = (idx + 1) % 4

```

我會再做一個轉換，因為 `(idx - 1) % 4` 的效果其實等價於 `(idx + 3) % 4`，為了不用去擔心負數的指針，直接用正數比較方便，因此上面的程式碼可以稍微精簡一下，寫成如下的程式碼：

```python
class Solution:
    def isRobotBounded(self, instructions: str) -> bool:
        coordinate = (0, 0)
        directions = [(0,1), (1,0), (0,-1), (-1, 0)]
        idx = 0
        direction = directions[idx]
        for i in range(4):
            for instruction in instructions:
                if instruction == 'R':
                    idx = (idx + 1) % 4
                    direction = directions[idx]
                if instruction == 'L':
                    idx = (idx + 3) % 4
                    direction = directions[idx]
                if instruction == 'G':
                    coordinate = (coordinate[0] + direction[0], coordinate[1] + direction[1])
        return coordinate == (0, 0)

```

## 重構程式碼（理解此道題目）

思考到這裡，我才會建議去看 LeetCode 上最後的正解，這樣的答案在 LeetCode 上是可以通過的，而且只是多跑了一個固定常數的迴圈，所以不會影響時間複雜度，但是雖然上面已經透過「觀察」到至多只要跑四次就一定會知道答案，可是有沒有辦法我只要分析一次指令，不用四次全部跑完，就會知道答案為何？

有可能的，有以下幾種情況

第一種情況：如同題目的範例一，這個指令一走完就馬上回到原點了，這種情況只要執行一次我們就知道了。

第二種情況：跟範例一的情況相反，走完一次指令後，沒有在原點，這才是真正麻煩的地方，但是我們知道有一種情況，一定不可能回原點，那就是走完指令如果沒有在原點，卻又面向北方的指令，因為如果這個指令一直執行下去，機器人只會一直往北一直往北，所以當走完一次指令的時候，不在原點卻還是面向北方那我們就要回傳 `False` 。

在 45 分鐘內，我其實最多就思考到這裡了，其實我心裡一直糾結著我要怎麼證明其他面向其他方位的情況是真的可以回到原點的？可是時間不夠，我寫到這裡就送出了，結果真實結果嚇了我一跳，所有的測試全數通過。

這道題目給我的經驗是，如果是練習遇到這種題目，當要想盡辦法寫出，可是當真正面試到這種題目時，由於有些題目很有可能根本不能套用題型，自己只能盡量把握自己觀察到的現象寫出來，並且跟面試官說明自己的想法，有時候或許有些地方想不到，但是卻有出乎意料的結果。

```python
class Solution:
    def isRobotBounded(self, instructions: str) -> bool:
        coordinate = (0, 0)
        directions = [(0,1), (1,0), (0,-1), (-1, 0)]
        idx = 0
        direction = directions[idx]
        for instruction in instructions:
            if instruction == 'R':
                idx = (idx + 1) % 4
                direction = directions[idx]
            if instruction == 'L':
                idx = (idx + 3) % 4
                direction = directions[idx]
            if instruction == 'G':
                coordinate = (coordinate[0] + direction[0], coordinate[1] + direction[1])
        return coordinate == (0, 0) or idx != 0

```