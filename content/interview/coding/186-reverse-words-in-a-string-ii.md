---
slug: "186-reverse-words-in-a-string-ii"
section: "coding"
title: "186. Reverse Words in a String II"
status: "published"
pinned: false
tags: ["Array", "Two Pointers"]
created_at: 1698802659
updated_at: 1698805802
published_at: 1698802659
---
[186. Reverse Words in a String II](https://leetcode.com/problems/reverse-words-in-a-string-ii/)

> 這個題目是 Reverse Words in s Sting 題組中的第二個題目，但是我會建議先完成 [151\. Reverse Words in a String](/interview/coding/151-reverse-words-in-a-string) 和 [557\. Reverse Words in a String III](/interview/coding/557-reverse-words-in-a-string-iii) 再來寫這個題目。

不同於 151 和 557 兩題，這個題目給的 input 是一個陣列，這個陣列是由多個字元所組成，但是看起來還是很像 151 以及 557 的題目的 input ，多個字元可以組成城一個單字，題目要我們把這個單字反向排列，並且保持著原始的資料型態，那就是陣列內還是由多個字元組成。

題目還有一個條件，那就是題目並不要求我們回傳答案，題目檢查答案的方式是透過檢查原本 input 的記憶體位置 ，也就是說我們需要透過修改原本記憶體空間的方式去達成題目的要求。

其實題目的這一點才是讓這個題目困難的地方，因為如果沒有要求，我們只要把這個陣列先轉換成字串，並且使用 151 題的演算法，即可得到答案，尤其是這個題目還不會有額外空格需要處理的情況。

這個題目後面解不解的出來，其實需要依靠一點點的經驗，如果題目給的是一個陣列，並且要求我們需要直接在原先的記憶體上做操作，很大的機率是會需要雙指針來處理的題目，畢竟因為如果只有一個指針，我們很難把某個記憶體位置的值放到另一個記憶體位置上後，還保留著另一個記憶體位置的值，並把他放到對的位置上。

但是就算想到了雙指針，這個題目還是沒有很直覺，因為這個雙指針怎麼指，我們都沒有辦法在原先的陣列上把所有的東西都換過來，我能想到的頂多就是把整個陣列的元素反向排列就好。

上面的這個點滿關鍵的，其實這就是為什麼面試的時候需要多把想到的東西講出來，因為講出來後，就比較容易觀察到這個題目的解題重點，那就是如果把整個陣列反過來後，雖然單字的順序是反的，但是單字是很好透過空格去判斷的，那如果我們把單字再反向排序一次，單字的順序就會變成正序（負負得正），就可以得到我們想要的結果了。

```python
s = ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"]
# 反向排序變成
['e', 'u', 'l', 'b', ' ', 's', 'i', ' ', 'y', 'k', 's', ' ', 'e', 'h', 't']
# 再依序把每個單字再反向排序一次
1. ['b', 'l', 'u', 'e', ' ', 's', 'i', ' ', 'y', 'k', 's', ' ', 'e', 'h', 't']
2. ['b', 'l', 'u', 'e', ' ', 'i', 's', ' ', 'y', 'k', 's', ' ', 'e', 'h', 't']
...
```

得到以上的邏輯之後，其實寫出以下的答案：

```python
class Solution:
    def reverseWords(self, s: List[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        # 反向排列
        s.reverse()

        def swap(start, end):
            while start < end:
                s[start], s[end] = s[end], s[start]
                start += 1
                end -= 1

        # 和另外兩題一樣，透過快慢雙指針來界定單字的索引範圍
        slow = 0
        fast = 0
        while fast < len(s):
            if s[fast] != " ":
                fast += 1
            else:
                swap(slow, fast - 1)
                fast += 1
                slow = fast
        swap(slow, fast - 1)
            

```

上面的這個答案很接近官方的解答，我們又可以依靠另外兩題的快慢指針的經驗來解題。

但是其實我想要提供另一個答案，這是一個有辦法幫助我思考出答案的答案，那就是其實上面的答案中我並不需要使用 `reverse()` 這個 API ，我自己寫出的 `swap()` 其實就可以幫我做到整個陣列的反向排序。

```python
class Solution:
    def reverseWords(self, s: List[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        
        def swap(start, end):
            while start < end:
                s[start], s[end] = s[end], s[start]
                start += 1
                end -= 1
        
        swap(0, len(s) - 1)

        slow = 0
        fast = 0

        while fast < len(s):
            if s[fast] != " ":
                fast += 1
            else:
                swap(slow, fast - 1)
                fast += 1
                slow = fast
        swap(slow, fast - 1)
            

```

這僅是我個人的感受，那就是當我看到第一次使用 `swap()` 時，更接近我自己在白板上把整個陣列反向排列的過程，也因次我才更有機會去想到下一個步驟。