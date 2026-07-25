---
slug: "hackerrank-counting-valleys"
section: "coding"
title: "HackerRank Counting Valleys"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674972901
updated_at: 1674972901
published_at: 1674972901
---
[Counting Valleys](https://www.hackerrank.com/challenges/counting-valleys/problem)

這是 Hacker Rank 上面的題目，屬於多觀察類型的題目。

題目給出一個字串包含了「U」和「D」，兩個字元，一個是往上爬，一個是往下走，我們要去走這個步道，出發地和目的地都是在海平面，求這一路上有多少的山谷。

山谷的定義一段路都是在海平面以下，這段路如果都是起起伏伏的，但是沒有高過海平面的話，都是屬於同一個山谷，我們只能算做一次，題目也可以換另一個方式考，把山谷換成山脊。

老實說題目屬於簡單，不過我還是想了很久才想到要怎麼解，我試過從我知道的演算法，二分搜索，雙指針來做，我覺得不是做不出來，不過寫下去會發現題目給的限制鬆散（山谷的定義），遇到程式碼限制鬆散的情夼，寫起程式來一直要去判斷各種 Coner cases ，反而很容易遇到錯誤。

於是我就畫圖，如果要判斷是不是山谷，很重要的一點是要找一路上海平面轉折的地方在哪裡，因為有海平面的地方，就是山谷山脊的交界處，這時候很建議可以畫張圖看看，畫完就會觀察到，從山谷的頭尾去看，**山谷從海平面開始的起始點，下一個位置一定是往下走的，山谷的終點上一個位置一定是往上走的**。我們要判斷的條件就只剩下上面那個條件。

所以題目就變成，我們要判斷：**一路上走回海平面的位置**。

我們先將 U 和 D 轉換成數字的 1 與 -1 ，並且建立一個 `mountainArray` ，建立的時候，我們要注意要將題目沒有提到的起點與終點加進去。`mountainArray` 的每個元素就是前一個位置所在的高度，加上當前往上或是往下的步伐。

```python
path = [1 if step == 'U' else -1 for step in path]
mountainArray = [0] * (steps + 2)
for i in range(len(path)):
    mountainArray[i+1] = mountainArray[i] + path[i]

```

接著我們要找出返回海平面所發生的位置

```python
seaLevls = [idx for idx, val in enumerate(mountainArray) if val == 0]

```

最後一步是計算出有幾個山谷，我們每次要拿出兩個海平面的位置，檢查**山谷從海平面開始的起始點，下一個位置一定是往下走的，山谷的終點上一個位置一定是往上走的**這個條件有沒有成立，這裡沒有加等號的原因是因為如果是等號，代表我們一直在平地上面行走。

整體的時間複雜度是 $O(n)$，空間複雜度也是 $O(n)$

```python
#!/bin/python3

import math
import os
import random
import re
import sys

#
# Complete the 'countingValleys' function below.
#
# The function is expected to return an INTEGER.
# The function accepts following parameters:
#  1. INTEGER steps
#  2. STRING path
#

def countingValleys(steps, path):
    # Write your code here
    path = [1 if step == 'U' else -1 for step in path]
    mountainArray = [0] * (steps + 2)
    for i in range(len(path)):
        mountainArray[i+1] = mountainArray[i] + path[i]
    seaLevls = [idx for idx, val in enumerate(mountainArray) if val == 0]
    valleys = 0
    for i in range(1, len(seaLevls)):
        left = seaLevls[i-1]
        right = seaLevls[i]
        if mountainArray[left + 1] < 0 and mountainArray[right - 1] < 0:
            valleys += 1
    return valleys

if __name__ == '__main__':
    fptr = open(os.environ['OUTPUT_PATH'], 'w')

    steps = int(input().strip())

    path = input()

    result = countingValleys(steps, path)

    fptr.write(str(result) + '
')

    fptr.close()

```