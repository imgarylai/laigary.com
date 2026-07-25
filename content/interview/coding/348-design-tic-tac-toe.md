---
slug: "348-design-tic-tac-toe"
section: "coding"
title: "348. Design Tic-Tac-Toe"
status: "published"
pinned: false
tags: ["Object Oriented Design"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[348\. Design Tic-Tac-Toe](https://leetcode.com/problems/design-tic-tac-toe/)

```python
class TicTacToe:

    def __init__(self, n: int):
        """
        Initialize your data structure here.
        """
        self.n = n
        self.rows = [0]*n
        self.cols = [0]*n
        self.diagonal = 0
        self.anti_diagonal = 0



    def move(self, row: int, col: int, player: int) -> int:
        """
        Player {player} makes a move at ({row}, {col}).
        @param row The row of the board.
        @param col The column of the board.
        @param player The player, can be either 1 or 2.
        @return The current winning condition, can be either:
                0: No one wins.
                1: Player 1 wins.
                2: Player 2 wins.
        """
        currentPlayer = 1 if player == 1 else -1
        self.rows[row] += currentPlayer
        self.cols[col] += currentPlayer

        if row == col:
            self.diagonal += currentPlayer

        if col == len(self.cols) - row - 1:
            self.anti_diagonal += currentPlayer

        k = len(self.rows)
        if abs(self.rows[row]) == k or abs(self.cols[col]) == k or abs(self.diagonal) == k or abs(self.anti_diagonal) == k:
            return player

        return 0

```