---
slug: "207-course-schedule"
section: "coding"
title: "207. Course Schedule"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1698803641
published_at: 1674973113
---
[207\. Course Schedule](https://leetcode.com/problems/course-schedule/)

這一個題目的設計滿巧秒的，我個人覺得這個題目綜合了**樹的遍歷（遞迴）、回溯法、動態規劃以及資料與圖形轉換**的設計，外加上題目可以套用在各種現實生活問題中。所以整體而言 LeetCode 給出了中等難度，但是細節很多很需要小心的想通。

先看看題目可以怎麼想，所有的課程與其先修課程基本上就是**很一顆或是很多棵樹**，也就是說如果一棵樹裡面沒有任何的環，我們就知道不會有一個課程他的先修課是另外一門課，而那門課的先修課又是該堂課的情況。

目標就變得很明確，我們要找出此棵樹沒有環，但是就要回到題目看看給定的課程與先修課程的關係，這是一個數列，但是並沒有特定的排列順序，所以我們需要一個可以快速查找的課程有哪些先修課的表：

```python
table = defaultdict(list)
for prerequisite in prerequisites:
    course, prerequisiteCourse = prerequisite
    table[course].append(prerequisiteCourse)

```

這張表就是前言一開始提到的**資料與圖的轉換**。

## 方法一：回溯法（超時）

透過最後的 For loop，我們是要檢查每一個課程，是否有一個環在內，如何確定的是否有環，就是在我們去發展這探索該樹的時候，遇到的課程是否已經造訪過了，題目的範例都沒有問題，但是這樣的方法會超時。

因為如果有 $n$ 門課程，相當於我們其實要遍歷這麼多顆樹，如果說第 $i$ 門課有先修課 $k$ ，那這樣的方法就會在探索時，再次檢查第 $k$ 門課是不是有環的存在。有點像是動態規劃的子問題。

```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        if not prerequisites:
            return True
        table = defaultdict(list)
        for prerequisite in prerequisites:
            course, prerequisiteCourse = prerequisite
            table[course].append(prerequisiteCourse)

        visited = set()
        def backtrack(currentCourse):
            if currentCourse in visited:
                return True
            visited.add(currentCourse)
            for course in table[currentCourse]:
                if backtrack(course):
                    return True
            visited.remove(currentCourse)
            return False

        for i in range(numCourses):
            if backtrack(i):
                return False
        return True

```

## 方法二：回溯法＋記憶

方法一會超時的原因是因為，我們會不斷地去檢查已經檢查過的樹，而更好的方法應該是，當一棵樹檢查完畢後，我們就把該課程記錄起來，讓我們知道該課程已經確定不會有環了，不用再檢查了。由於 `set()` 只能記憶著是否看過，沒辦法記憶該課程是否可以修，所以這裡可以改用 Hash Table 來記憶。

```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        if not prerequisites:
            return True
        table = defaultdict(list)
        for prerequisite in prerequisites:
            course, prerequisiteCourse = prerequisite
            table[course].append(prerequisiteCourse)

        visited = {}
        def backtrack(currentCourse):
            if currentCourse in visited:
                return visited[currentCourse]
            visited[currentCourse] = True
            for course in table[currentCourse]:
                if backtrack(course):
                    return True
            visited[currentCourse] = False
            return visited[currentCourse]

        for i in range(numCourses):
            if backtrack(i):
                return False
        return True

```

至此，就能夠一並完成課程規劃二的題目，那就是我們不只要知道課程的安排有沒有問題，還要返回修課的順序，如果前面已經想到要怎麼做了，接下來很容易卡住有盲點，本來只是要判斷有沒有環，那要在哪裡怎麼記錄路徑的資訊呢？

這時候我會建議將 backtrack 的部分跳出來看，一整個 for 迴圈，其實就是一個**後序遍歷**， 假設，如果我們有一個正確的修課順序表，接著要印出所有的修課順序，就恰好是一個後序遍歷的結果，所以我們只要在完成後續遍歷的地方做紀錄即可。

## 記錄修課順序

1.  如果沒有任何先修課的條件，那修課順序就直接從課程 0 一路修到課程 n - 1 為止
2.  每一門課的去做回溯法
3.  如果發現了有課程會造成環，那就回覆空陣列
4.  如果跑完每一個課程，都沒有問題，那後序遍歷的順序就是修課的順序

```python
class Solution:
    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        if not prerequisites:
            return [i for i in range(numCourses)]
        table = defaultdict(list)
        for prerequisite in prerequisites:
            course, prerequisiteCourse = prerequisite
            table[course].append(prerequisiteCourse)
        visited = {}
        order = []
        def backtrack(currentCourse):
            if currentCourse in checked:
                return False
            if currentCourse in visited:
                return visited[currentCourse]
            visited[currentCourse] = True
            for course in table[currentCourse]:
                if backtrack(course):
                    return True
            visited[currentCourse] = False
            order.append(currentCourse)
            return visited[currentCourse]

        for i in range(numCourses):
            if backtrack(i):
                return []
        return order

```