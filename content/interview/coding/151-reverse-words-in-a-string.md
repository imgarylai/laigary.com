---
slug: "151-reverse-words-in-a-string"
section: "coding"
title: "151. Reverse Words in a String"
status: "published"
pinned: false
tags: ["String", "Two Pointers"]
created_at: 1698537978
updated_at: 1710027770
published_at: 1698537978
---
[151\. Reverse Words in a String](https://leetcode.com/problems/reverse-words-in-a-string/)

題目是給定一個字串，這個字串的模式是，這個字串很像是一個句子，但是是由多個單字以及「多個」空格所組成的。

例如：

1.  看起來正常的句子： `s = "the sky is blue"`
2.  看起來正常的句子，但是頭尾多出了額外的空格： `s = " hello world "`
3.  看起來正常的句子，但是單字中間中，多出了額外的空格：s = `"a good example"`

然後題目要求我們要把把所有的單字反向排列好後，並且依照第一個例子中的方式呈現，也就是說要去除掉不必要的空格。

這個題目會需要用到的 API 並不困難，而且答案也很好想，但是這個題目在面試中麻煩的是這個題目的解法滿多元的，相信多數的工程師可以快速想到一種找出答案的解法，但是在面試中快速地回答出問題後，很容易會有接續的問題，去考察面試者能不能夠用不同的方法來解的時候，這個地方會比較容易卡住。

現在的面試都可以讓面試者選擇自己熟悉的程式語言，像是我很習慣用 Python 來面試，而在 Python 中，這個題目可以很簡單的使用幾個 API 來完成。

其實這個題目比較麻煩的只有我需要把額外的空白給清除，並且用一個陣列依序紀錄每個單字就好。Python 其實就馬上有提供 `strip()` 這個 API 可以把上面各種情況的字串直接切分成好幾個單字，並且依序地存放在一個陣列裡面。

接著只要再處理單字的到序排列就好，Python 的陣列有提供 `reverse()` 的 API 可以完成，亦或是 `reversed()` 這個 API 。

最後的只要把陣列再組合成一個單一的字串，並且用空格相連，這時候可以使用 `join()` 這個 API。

整個邏輯可以用以下的方式來實踐：

```python
class Solution:
    def reverseWords(self, s: str) -> str:
        tmp = s.split()
        tmp.reverse()
        return " ".join(tmp)
```
```python
class Solution:
    def reverseWords(self, s: str) -> str:
        return " ".join(reversed(s.split()))
```

但如如果自己熟悉的語言沒有提供這些 API ，又或是面試官說可不可以用其他的方法來完成的時候，就可以去認真想想題目的特性。

其實這個題目可以使用雙指針的快慢指針來完成。

```python
class Solution:
    def reverseWords(self, s: str) -> str:
  
        holder = []
        
        slow = 0
        fast = 0
        
        while fast < len(s):
            if s[fast] == " ":
                if fast == slow:
                    fast += 1
                    slow += 1
                else:
                    holder.append(s[slow:fast])
                    fast += 1
                    slow = fast
            else:
                fast += 1
                    
        if fast != slow:
            holder.append(s[slow:fast])
        holder.reverse()
        return " ".join(holder)
```

: