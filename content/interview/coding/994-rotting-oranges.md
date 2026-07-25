---
slug: "994-rotting-oranges"
section: "coding"
title: "994. Rotting Oranges"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1674972896
updated_at: 1709368057
published_at: 1674972896
---
[994\. Rotting Oranges](https://leetcode.com/problems/rotting-oranges/)

題目的說明

題目有說明的有，腐爛的橘子會影響旁邊的好橘子，好橘子會爛掉，如果好橘子相連的好橘子有和爛橘子相連，過了一段時間後也會爛掉，如果有橘子沒有和任何的爛橘子相鄰就不會壞掉。

除了題目有說明的點以外，還有幾個條件要先確定好：

1.  如果所有橘子都是壞掉的，那要回傳的時間為零
2.  如果一個橘子都沒有，回傳的時間為零
3.  如果所有橘子都是好的，回傳的時間為 -1

這個題目的技巧在於，一開始要把所有的爛掉的橘子放在出發點，並且透過 BFS 同時出發，當全部的橘子都探索完了，就可以知道要花多少時間了，所需要花的時間就是 BFS 所走的層數。

這裡有另外一個點是，要如何知道有沒有橘子壞掉？第一個直覺的方法是全部感染完後，重新掃描看看還有沒有好的橘子就好了，其實這樣做不會造成太多的理論時間複雜度的差別，但是這樣會讓 code 變得很複雜。

第二個方法是我們一開始的時候就計算出有多少的新鮮的橘子，在 BFS 時，只要有一個橘子壞掉了，我們就減一，最後只要判斷，如果新鮮的橘子沒了，就是所有的橘子都感染完成了。

最後有一個地方要注意，那就是到了最後一步，我們會放進去的是壞掉的橘子，這樣會讓 BFS 多走一步，有兩個方法可以選擇

1.  在做 BFS 的同時，也要確保還有新鮮的橘子 `while queue and fresh_oranges > 0` ，這樣也合理，如果已經沒有新鮮的橘子了，就不需要再探索了。
2.  不要加上上面的條件，直接在最後的 mins - 1 就好了，兩種條件都可以通過。

```python
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        queue = deque()
        fresh_oranges = 0

        for row in range(rows):
            for col in range(cols):
                if grid[row][col] == 2:
                    queue.append((row, col))
                elif grid[row][col] == 1:
                    fresh_oranges += 1

        directions = [(1,0), (-1,0), (0,1), (0,-1)]
        mins = 0

        if not queue and fresh_oranges > 0:
            return -1

        if fresh_oranges == 0:
            return mins

        # BFS 
        while queue and fresh_oranges > 0:            
            mins += 1
            for _ in range(len(queue)):
                row, col = queue.popleft()
                for dr, dc in directions:
                    next_row = row + dr
                    next_col = col + dc
                    if 0 <= next_row < rows and 0 <= next_col < cols: 
                        if grid[next_row][next_col] == 1:
                            queue.append((next_row, next_col))
                            grid[next_row][next_col] = 2
                            fresh_oranges -= 1

        return mins if fresh_oranges == 0 else -1

```