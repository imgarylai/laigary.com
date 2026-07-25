---
slug: "1136-parallel-courses"
section: "coding"
title: "1136. Parallel Courses"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1709444491
published_at: 1674973113
---
[1136\. Parallel Courses](https://leetcode.com/problems/parallel-courses/)

這個題目是 [207\. Course Schedule](/interview/coding/207-course-schedule) 和 [210\. Course Schedule II](/interview/coding/210-course-schedule-ii) 的進階問題，其實這個題目更像是 Course Schedule III 的題目。Course Schedule III 的題目反而不像 Course Schedule 的系列題目。

題目給定一系列的課程跟先修課程的資料，和這個題目前面的系列課程一樣，如果說沒辦法排列出來，那就回覆 -1 ，如果說可以排列出來，那就回覆可以用**最少**需要幾個學期修完課。

這個「最少」其實是這個題目最需要燒腦的點。我在寫 LeetCode 的時候，會希望看看能不能先從之前題目的經驗去慢慢展開題目的核心。

我們先不心急，就照搬之前的程式碼，起碼我們知道一件事情，就是給的所有的課程列表，如果有環我們就直接回傳 -1 。而且我們知道，如果要找到最後的答案，把答案找出的同時，頂多和找環的時間複雜度一樣，兩倍一樣的時間複雜度並不會真的增加我們的時間複雜度，這樣的話，不如把找環當作回答題目的一個部分，找出「最少」修課路徑是另外一個部分。寫出來再看看能不能優化。

## 找出是否有環

```python
class Solution:
    def minimumSemesters(self, n: int, relations: List[List[int]]) -> int:
        if not relations:
            return -1
        table = defaultdict(list)
        for prevCourse, nextCourse in relations:
            table[prevCourse].append(nextCourse)

        visited = {}
        def hasCycle(currentCourse: int) -> bool:
            if currentCourse in visited:
                return visited[currentCourse]
            visited[currentCourse] = True
            for course in table[currentCourse]:
                if backtrack(course):
                    return True
            visited[currentCourse] = False
            return visited[currentCourse]

        for i in range(n):
            if hasCycle(i):
                return -1
        # TODO

```

只要確定沒有環了，就可以去想要怎麼樣去找出最少修課的課程，剩下的招就兩個，一個是 BFS 一個是 DFS ，我沒有選擇 BFS 的原因是因為，在這個題型裡面，BFS 的實作真的會比較複雜一點。只是在我的經驗上，DFS 的話在 Memorization 會比較方便。

如果說沒有想法的話，推薦可以先去看 [329\. Longest Increasing Path in a Matrix](/interview/coding/329-longest-increasing-path-in-a-matrix) 。那題的答案基本上就是這題的最後部分。

## 合併

TODO

## BFS

```python
class Solution:
    def minimumSemesters(self, n: int, relations: List[List[int]]) -> int:
        graph = {i: [] for i in range(1, n + 1)}
        indegree = {i: 0 for i in range(1, n + 1)}
        for prevCourse, nextCourse in relations:
            graph[prevCourse].append(nextCourse)
            indegree[nextCourse] += 1

        queue = deque([])
        for node in graph:
            if indegree[node] == 0:
                queue.append(node)
        step = 0
        studied = 0
        while queue:
            step += 1
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                studied += 1
                for child in graph[node]:
                    indegree[child] -= 1
                    if indegree[child] == 0:
                        queue.append(child)
        return step if studied == n else -1

```