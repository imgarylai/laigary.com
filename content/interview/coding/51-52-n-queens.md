---
slug: "51-52-n-queens"
section: "coding"
title: "51. & 52. N Queens"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674843472
updated_at: 1674843756
published_at: 1674843472
---
[51\. N-Queens](https://leetcode.com/problems/n-queens/) & [52\. N-Queens](https://leetcode.com/problems/n-queens-ii/)

這個題目也是透過棋類遊戲的規則所設計出的一個回溯法的問題，如同前言所示，棋類遊戲需要快速的找出幾個可行解，接著在心中的棋盤放下那個旗子，並繼續往下推演，如果推演下去發現並不好或是無法滿足遊戲規則，就換下一個可行解來找。

皇后問題的困難點在於，題目有兩個大方向去思考，第一個是回溯法的邏輯要怎麼處理，第二個是要怎麼處理該棋盤位置皇后是否可以放上去，而這兩個處理的方法又有部份交疊，所以讓這個題目的細節不怎麼好處理。

首先先看一眼皇后在棋盤上的的規則

1.  同一行不能有皇后，在程式裡面很好透過行的遍歷來處理
2.  同一列不能有皇后，在程式裡面很好透過列的遍歷來處理
3.  主對角線上不能有皇后，這沒有這個好處理，晚點再來討論
4.  反對角線上不能有皇后，這沒有這個好處理，晚點再來討論

了解以上的規則後，就可以開始想我們會怎麼樣的放置皇后，這裡請先忽略第三第四個條件，假設我們在一個位置上放置了皇后，只考慮該行和該列就再也不能放置，我們就可以用以下的方式來走訪。下

面的走訪方式是一列一列的方式往下找下一個可以放的位置，走到該列的時候，就去看哪些行可以放置皇后，並且使用一個記憶體位置去記憶哪些行已經造訪過了。

```python
cols = set()
def backtrack(row):
    # base case 
    # TODO
    for col in range(n):
        if col not in cols:    
            cols.add(col)
            board[row][col] = "Q"

            backtrack(row + 1)

            board[row][col] = "."
            cols.remove(col)
```

這裡有一個很重要的點，那就是為什麼我們要這樣紀錄？其實我當初在寫的時候有懷疑自己是否真的可以先暫時不處理第三第四個條件的來遍歷？因為如果沒有第三第四個條件，放置的方法其實根本可以照下面這樣寫，只要每次都橫移一格，就一定不會在行列上有皇后。不過這樣可以發現其實也不是回溯法了，就是用遞迴的方式去遍歷而已，所以我才會覺得上面寫的方向，應該是沒有錯的可以繼續擴展。

```python
def backtrack(row, col):
    # base case 
    # TODO
    board[row][col] = "Q"
    backtrack(row + 1, col + 1)
```

也就是說按照上面的程式，這樣的走訪方式應該是沒有問題的，所以要回來開始處理第三、第四個條件，也就是正對角線和反對角線不能有皇后，這裡是題目最難的地方了，我也就在這裡卡住不知道怎麼走下去，我認為透過觀察是有辦法觀察出來的，可是沒有提示的話很觀察到。

```python
cols = set()
def backtrack(row):
    # base case 
    # TODO
    for col in range(n):
        # TODO:
        # diagonal_is_valid and anti_diagonal_is_valid
        if col not in cols and diagonal_is_valid and anti_diagonal_is_valid:
            cols.add(col)
            board[row][col] = "Q"

            backtrack(row + 1)

            board[row][col] = "."
            cols.remove(col)
```

這裡有一個二維矩陣的特性，如果知道的話後面的題目就會很好做，這裡我自己定義一件事情，那就是同一的對角線上的元素，我統一通稱他們有一樣的對角線座標，求座標的方式如下：

1.  在同一個正對角線上的元素，其對角線座標可以用行的座標 - 列的座標（或列的座標 - 行的座標 ）
2.  在同一個反對角線上的元素，其對角線座標可以用行的座標 + 列的座標（或列的座標 + 行的座標 ）

```text
   0    1   2   3  4 
0[[ 0,  1,  2,  3, 4],
1 [-1,  0,  1,  2, 3],
2 [-2, -1,  0,  1, 2],
3 [-3, -2, -1,  0, 1],
4 [-4, -3, -2, -1, 0]]
```

所以檢查第三第四個條件的方式就是，檢查對角線座標是否有放置過了，檢查的方式和檢查行其實一模一樣。

```python
res = []
board = [['.'] * n for _ in range(n)]
cols = set()
diagonals = set()
anti_diagonals = set()
def backtrack(row):
    # base case 
    # TODO
    for col in range(n):
        curr_diagonal = row - col
        curr_anti_diagonal = row + col
        if (col not in cols and 
                curr_diagonal not in diagonals and 
                curr_anti_diagonal not in anti_diagonals):

            cols.add(col)
            diagonals.add(curr_diagonal)
            anti_diagonals.add(curr_anti_diagonal)
            board[row][col] = "Q"

            backtrack(row + 1)

            board[row][col] = "."
            anti_diagonals.remove(curr_anti_diagonal)
            diagonals.remove(curr_diagonal)
            cols.remove(col)
```

最後的一步就是要處理最後的終止條件了，終止條件為，如果我們在最後一列可以成功找到一個位置可以放，那我們往下再走一步的時候，列的座標就會超過邊界，於是我們就可以返回結果。

```python
# n - 1 是最後一列
if row == n:
    res.append([''.join(r) for r in board])
    return
```

整理出的結果為

```python
class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        res = []
        board = [['.'] * n for _ in range(n)]
        cols = set()
        diagonals = set()
        anti_diagonals = set()


        def backtrack(row):
            if row == n:
                res.append([''.join(r) for r in board])
                return
            for col in range(n):
                curr_diagonal = row - col
                curr_anti_diagonal = row + col
                # a queen has been placed in all directions
                if (col not in cols and 
                    curr_diagonal not in diagonals and 
                    curr_anti_diagonal not in anti_diagonals):

                    cols.add(col)
                    diagonals.add(curr_diagonal)
                    anti_diagonals.add(curr_anti_diagonal)
                    board[row][col] = "Q"

                    backtrack(row + 1)

                    board[row][col] = "."
                    anti_diagonals.remove(curr_anti_diagonal)
                    diagonals.remove(curr_diagonal)
                    cols.remove(col)                    


        backtrack(0)

        return res
```