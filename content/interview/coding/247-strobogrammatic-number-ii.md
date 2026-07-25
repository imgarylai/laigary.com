---
slug: "247-strobogrammatic-number-ii"
section: "coding"
title: "247. Strobogrammatic Number II"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674845310
updated_at: 1709446074
published_at: 1674845310
---
[247\. Strobogrammatic Number II](https://leetcode.com/problems/strobogrammatic-number-ii/)

根據 Leetcode 的資料，這一題是 Google 常見的考題，這一題程式是很好寫，可是最困難的是這個問題的邏輯並不好想。

題目給的 `n` 的長度最大是到 14 ，看起來很小，不過這個數字真正代表的是最大的搜索區間是落在是 $[10^{13}, 10^{14}]$ 的，這個 `n` 是一個非常非常大的數字！如果已經做過題目 [246\. Strobogrammatic Number](/interview/coding/246-strobogrammatic-number) ， 的確可以想到用暴力解找到。

演算法的題目寫多了就會可以快速觀察到，如果今天我們要找的一個數字，是非常稀缺的話，暴力法一定不是一個好解法，像是 [204\. Count Primes](/interview/coding/204-count-primes) 這題，質數是一個很難找的數字，尤其數字越大會越難找到，這一題最大的 `n` 可以是 14，不過在 14 位數的情況，大約是幾十兆的數字中，也才出現六萬兩千五百個數字而已，比例大概是 `6.9444444e-10%` 。

但是題目已經放在回溯法的區域了，所以可以快速的推論這題是要用回溯法來寫，但是這樣算是一個作弊，因為真實的面試情況，我們是不會知道題目應該要怎麼做的，所以我還是想要寫寫要怎麼樣想到用回溯法來寫？不過嚴格來說，這個題目只要窮舉，處理邏輯的方式和回朔法很像，但其實只是一個遞迴的問題，不過又不存在著重疊子問題，所以也不是動態規劃。

首先，先看這個題目的特性，是不是一個要我們窮舉所有可能的窮舉題？題目問的就是窮舉出所有的 Strobogrammatic Number，窮舉的空間非常大，就如同上方的分析，但是又因為是 Strobogrammatic Number 的特性，可以幫助快速的把窮舉的空間進行剪枝，大大的降低時間複雜度，其實我也是沒有信心在面試中是不是可以用窮舉的方法來進行，如同我其他篇文章的建議，禮貌性地問一下面試官，想法對不對，是不是在正確的方向上，好的公司與好的面試官應該要在這裡適時的給予指引。

到了這裡，大概可以寫出以下的結構，不過這就是這題困難的地方，其實有很多的細節還沒有處理到。

```python
class Solution:
    def findStrobogrammatic(self, n: int) -> List[str]:
        table = {
            '1': '1',
            '6': '9',
            '8': '8',
            '9': '6',
            '0': '0'
        }
        ans = []
        def backtrack(curr, n):
            if n == 0:
                ans.append(curr)
                return
            # TODO
            backtrack(curr, n - ?)
            
        backtrack('', n)
        return ans
```

第一個問題是，我們要怎麼樣不斷的窮舉使其符合 Strobogrammatic Number 的特性？應該有幾種情況

1.  我從 `0, 1, 8` 開始出發，當作最中間的數字，後面就很像處理[回文問題](/interview/coding?tag=Palindrome)一樣，往左右出發，產生出類似：`609, 101, 818, 808` ...等數字，為什麼沒有考慮從 `6, 9` 出發呢？因為如果這兩個字在中間，會不符合 Strobogrammatic Number 的特性，所以最中間的數字，不能是 `6` 或 `9` 。
2.  既然和[回文問題](/interview/coding?tag=Palindrome)很像，回顧一下回文問題的要注意的地方，那就是回文有兩種，一種是長度為奇數的情況，一種是長度為偶數的情況。其實上面的情況就是當長度為奇數的情況，如果長度為偶數的情況，基本上
3.  最後一個要考量的點是，這個數字要是一個合法的數字，所以如果是 `010` 這樣的數字，就是不合法的，如果是偶數長度的情況 `00` 也是不合法的，也就是說最**左側與最右側的數字，不能是 0** 。

綜合以上三點的分析，我們就可以進一步的去發展題目的演算法，首先我會想要先解決的是奇數與偶數的問題，和回文問題一樣，當最中間的值確定後，其實奇數回文的剩餘解法就會和偶數回文一樣，因此我會先處理這個問題。

```python
class Solution:
    def findStrobogrammatic(self, n: int) -> List[str]:
        table = {
            '1': '1',
            '6': '9',
            '8': '8',
            '9': '6',
            '0': '0'
        }
        ans = []
        def backtrack(curr, n):
            if n == 0:
                ans.append(curr)
                return
            # TODO
            backtrack(curr, n - ?)
        
        if n % 2 == 1:
            for i in ['0', '1', '8']:
                backtrack(i, n - 1)
        else:
            backtrack('', n)
            
        return ans
```

解決完上面的問題之後，剩下的基本上就和回朔法一樣，不斷地去探索答案，大致上的邏輯如下，回溯法內部的處理就是一種深度優先搜索的概念，處理的方式和回文很像，從中間向兩邊擴展，只是回文是前後要相等，這裡要處理的是前後要可以形成 Strobogrammatic Number 。

```python
class Solution:
    def findStrobogrammatic(self, n: int) -> List[str]:
        table = {
            '1': '1',
            '6': '9',
            '8': '8',
            '9': '6',
            '0': '0'
        }
        ans = []
        def backtrack(curr, n):
            if n == 0:
                ans.append(curr)
                return
            for key in table:
                backtrack(key + curr + table[key], n - 2)
        
        if n % 2 == 1:
            for i in ['0', '1', '8']:
                backtrack(i, n - 1)
        else:
            backtrack('', n)
            
        return ans
```

上面的解法還存在一個問題，這裡我們還漏了處理左側與最右側的數字，不能是 0 的情況，寫到這裡處理的方式就不難了，因為我們每次都新增左邊和右邊個一個數字，所以當 n == 2 時，我們就是要新增最右邊了兩個數字了，在這個時候如果 key 是 0 ，我們就要記得跳過不處理。

```python
class Solution:
    def findStrobogrammatic(self, n: int) -> List[str]:
        table = {
            '1': '1',
            '6': '9',
            '8': '8',
            '9': '6',
            '0': '0'
        }
        ans = []
        def backtrack(curr, n):
            if n == 0:
                ans.append(curr)
                return
            for key in table:
                if n == 2 and key == '0':
                    continue
                backtrack(key + curr + table[key], n - 2)
        
        if n % 2 == 1:
            for i in ['0', '1', '8']:
                backtrack(i, n - 1)
        else:
            backtrack('', n)
            
        return ans
```

## 遞迴

有人分享了使用遞迴的解法，概念很類似，不過比較不好想到，放在這裡僅供參考。

```python
class Solution:
    def findStrobogrammatic(self, n: int) -> List[str]:
        odd = ['0', '1', '8']
        even = ['11', '69', '88', '96', '00']
        
        if n == 1:
            return odd
        elif n == 2:
            return even[:-1]
        else:
            if n % 2:
                prevs = self.findStrobogrammatic(n-1)
                candidates = odd
            else:
                prevs = self.findStrobogrammatic(n-2)
                candidates = even
            
            mid = (n-1)//2
            ans = []
            for prev in prevs:
                for candidate in candidates:
                    ans.append(prev[:mid] + candidate + prev[mid:])
            return ans
```