---
slug: "2211-count-collisions-on-a-road"
section: "coding"
title: "2211. Count Collisions on a Road"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1764995586
updated_at: 1765001247
published_at: 1764995586
---
[2211\. Count Collisions on a Road](https://leetcode.com/problems/count-collisions-on-a-road/)

這個題目我的想法可能過於複雜，不過應該是有包含所有的情景了。

我的思路主要就是透過目前車子的狀態跟左方車子前進的方向來去決定碰撞的情況。

```python
class Solution:
    def countCollisions(self, directions: str) -> int:
        
        stack = []
        collisions = 0
        
        for current_dir in directions:
            
            # 1. 堆疊為空：只接受 'R' 和 'S'
            #    'L' 遇到空堆疊 (L...): 永不碰撞，直接忽略
            if not stack and current_dir == 'L':
                continue
            
            # 2. R 與 L 碰撞： stack[-1] == 'R' and current_dir == 'L'
            #    這是最複雜的碰撞，會產生兩次碰撞，並引發連鎖反應。
            elif stack and stack[-1] == 'R' and current_dir == 'L':
                # 'R' 和 'L' 碰撞，產生 2 次碰撞，結果變成 'S'
                collisions += 2
                
                # 處理堆疊中所有連續的 'R'
                # 這些 'R' 都會撞上這個相撞點 (新的 'S')，每個造成 1 次碰撞
                stack.pop() # 彈出剛剛的 'R'
                while stack and stack[-1] == 'R':
                    stack.pop()
                    collisions += 1 # 每個 'R' 再加 1 次碰撞
                
                stack.append('S') # 最後推入一個 'S' (靜止點)
            
            # 3. S 與 L 碰撞： stack[-1] == 'S' and current_dir == 'L'
            #    'L' 撞上 'S'，產生 1 次碰撞，結果仍然是 'S'
            elif stack and stack[-1] == 'S' and current_dir == 'L':
                collisions += 1
                # 堆疊保持 'S' 不變
                
            # 4. R 與 S 碰撞： stack[-1] == 'R' and current_dir == 'S'
            #    'R' 撞上 'S'，產生 1 次碰撞，結果變成 'S'
            elif stack and stack[-1] == 'R' and current_dir == 'S':
                collisions += 1
                
                # 處理堆疊中所有連續的 'R' (連鎖反應)
                stack.pop()
                while stack and stack[-1] == 'R':
                    stack.pop()
                    collisions += 1 # 每個 'R' 再加 1 次碰撞
                    
                stack.append('S') # 最後推入一個 'S'
            
            # 5. 其他情況：直接推入
            #    包括：
            #    - 空堆疊 & 'R'/'S' (直接推入)
            #    - stack[-1] == 'R' & current_dir == 'R' (R...R 不碰撞)
            #    - stack[-1] == 'S' & current_dir == 'S' (S...S 不碰撞)
            #    - stack[-1] == 'S' & current_dir == 'R' (S...R 不碰撞, R 越過 S)
            else:
                stack.append(current_dir)
                
        return collisions
```