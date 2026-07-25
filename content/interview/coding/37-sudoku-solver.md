---
slug: "37-sudoku-solver"
section: "coding"
title: "37. Sudoku Solver"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844036
updated_at: 1674844182
published_at: 1674844036
---
[37\. Sudoku Solver](https://leetcode.com/problems/sudoku-solver/)

這一題和 [51\. & 52. N Queens](/interview/coding/51-52-n-queens) 的本質不會差太多。

如我在前言裡面所提到的，回溯法的本質和窮舉有關，思考排列組合窮舉的方式可以幫助我們思考回溯法如何的走訪。

以數獨的題目來說，我們要走訪的方式會是一列一列走，在走訪該列時，一行一行走，最後去判斷該位置可否放下符合數獨題目條件的數字，回朔法在某些題目中，可能會是這樣的出現。

```python
for row in range(len(rows)):
    for col in range(len(cols)):
        backtrack(row, col)
```

可是這樣一定是不對的因為上面那樣子的走法的意思是，我要從一個座標平面中的每一個點都當作出發點，並在每個出發點都進行一次回溯法（ [79\. Word Search](/interview/coding/79-word-search) 為例）。

而數獨的題目，`(0, 0)` 就可以當作出發座標，我們要走訪的是 `(0, 0) -> (n-1, n-1)` ，但是接下來要注意到的是，那我們到底要怎麼走？回溯法很多題目是在二維矩陣上面做搜尋的，通常我們並不在意搜尋的方向性，只要不越過邊界、符合題目條件，我們都可以往前移動後，再視情況進行回溯。

可是數獨的最好的方法其實是按照一個方向走下去，例如當人類在玩的時候，會盡可能地先完成一行、一列或一個正方形，這裡就是題目比較需要注意的地方，那就是我們要怎麼走訪數獨中的所有元素？

前面有提到走訪的方式會是一列一列走，在走訪該列時，一行一行走，因此在回溯法之中，我們每次走到該行的最後一個位置後，我們就要換下一列走，並且回到行的開頭，如果列可以成功走完了，代表目前數獨題目的所有位置都成功放對數字了，存在著解答，還有一個條件就是，如果走訪時遇到題目中已經先放置好的數字，那我們就繼續往下一個位置探索。

```python
def backtrack(row, col):
    # 每次走到該行的最後一個位置後，我們就要換下一列走，並且回到行的開頭
    if col == 9:
        return backtrack(row + 1, 0)

    # 列可以成功走完了，代表目前數獨題目的所有位置都成功放對數字了，存在著解答。
    if row == 9:
        return True

    if board[i][j] != '.':
        return backtrack(i, j+1)

    # TODO
```

剩下問題的部分就是，如何驗證該位子可以放哪個數字？這個部分比較簡單，可以自行理解，接下來就是如何進行回溯法。

基本上就是看從 `1 - 9` 哪個數字可以放進去，可以放進去，就繼續搜索，不行就退回，不過有一個小地方要注意是這個題目有非常大的搜索空間，題目只問了提供一組解就好，所以要盡快的回覆答案。

```python
class Solution:
    def solveSudoku(self, board: List[List[str]]) -> None:
        """
        Do not return anything, modify board in-place instead.
        """

        def isValid(row, col, num):
            # 驗證該行沒有重複元素
            for i in range(9):
                if board[row][i] == str(num):
                    return False
            # 驗證該列沒有重複元素
            for i in range(9):
                if board[i][col] == str(num):
                    return False
            # 驗證該方形沒有重複元素        
            for i in range(row//3*3, row//3*3+3):
                for j in range(col//3*3, col//3*3+3):
                    if board[i][j] == str(num):
                        return False
            return True

        def backtrack(row, col):

            if col == 9:
                return backtrack(row + 1, 0)

            if row == 9:
                return True

            if board[row][col] != '.':
                return backtrack(row, col+1)

            for num in range(1, 10):
                if isValid(row, col, num):
                    board[row][col] = str(num)
                    if backtrack(row, col+1):
                        return True
                    board[row][col] = '.'                    

            return False

        return backtrack(0, 0)
```