---
slug: "1884-egg-drop-with-2-eggs-and-n-floors"
section: "coding"
title: "1884. Egg Drop With 2 Eggs and N Floors"
status: "published"
pinned: false
tags: []
created_at: 1675041659
updated_at: 1675041798
published_at: 1675041659
---
[1884\. Egg Drop With 2 Eggs and N Floors](https://leetcode.com/problems/egg-drop-with-2-eggs-and-n-floors/)

這個題目其實是一個經典的演算法：[雙蛋問題](https://zh.wikipedia.org/wiki/%E5%8F%8C%E8%9B%8B%E9%97%AE%E9%A2%98) ，這是一個很經典的考題，但是我是面試完了才知道。

題目的敘述如同維基百科所寫：

給你兩個相同的異常堅硬的雞蛋，通過在一棟100層的樓的不同層扔下雞蛋進行實驗，試驗出可以摔碎該雞蛋的最高樓層（臨界樓層）。已知未碎的雞蛋可以重複使用。求最少的實驗次數 `n`，使得在 `n` 次實驗後，一定能判斷出該臨界樓層。

為了更加精確地思考問題，該問題中必須滿足以下的條件：

1.  如果雞蛋在某一層沒有碎，它不會在任何更低層的破碎。
2.  如果雞蛋在某一層碎了，它在更高層上一定會碎。
3.  雞蛋可能在一樓摔破，也可能在最高層還不摔破。

以上就是這個題目的精神，其實這個題目很像是我們在求時間複雜度的最糟狀況。

先思考的是如果我有無限顆雞蛋的情況下，最少的實驗次數一定是從中間的樓層開始丟，如果沒有破掉，我就在往更高樓的地方找，如果破掉了，我就往下找，每次的搜尋我都減少一半的搜索空間，如果我有一百層樓，搜索的次數會是 $log_{2}100 =     6.643856$ 至少需要七次的測試，時間複雜度 $O(logN)$ 。

可是如果我只有一顆蛋，我的策略就必須要保守一點，如果我從中間開始丟，雞蛋直接破掉了，那我就完全不知道解答是什麼了，一樣是一百層樓，那我就必須要從一樓開始丟，我需要丟 99 次，時間複雜度 $O(N)$ 。

不過這一題要問的，都不是上面兩種情況，要問的是如果只有兩顆蛋呢，可以是這樣嗎？我先用第一顆蛋嘗試，我從中間丟下去，沒有破，我就往上走，直到破掉為止，不過也很有可能我從五十樓一丟，蛋就破掉了，那我剩下個一顆蛋勢必要再從一樓開始，所以我總共要花 1 + 49 次，去實驗嗎？這是一個最糟的情況，可是其實這並不是答案，如果是有一百樓，正確的答案是只要花 14 次就可以了，這就是這個題目最困難的地方了，為什麼正確答案是 14 ？

要了解這個題目，也是要從二分法開始說起，二分法總共會分了兩邊，但是接下來就是一個線性搜尋，如果說一開始的分法，分多一點的話，是不是可以節省一點？這裡以十分法為例，把樓層總共分十等分，在 10, 20, 30, 40, 50, 60, 70, 80, 90 這些樓層丟雞蛋。

首先先看如果在 10 樓就碎了第一顆雞蛋，那接下來只要嘗試 1 - 9 樓，那總共的嘗試次數就是 1 + 9 = 10，如果 10 樓沒有碎，就在 20 樓再丟一次，如果碎了，那就是我們要嘗試 11 - 19 樓，總共是 2 + 9 = 11 次，

樓層

最少嘗試次數

10

10 (1+9)

20

11 (2+9)

30

12 (3+9)

40

13 (4+9)

50

14 (5+9)

60

15 (6+9)

70

16 (7+9)

80

17 (8+9)

90

19 (9+10) 這裡包含了最後的第一百樓

這裡我們可以看到需要嘗試的比起二分法來說，所需要嘗試的次數已經很接近到每次嘗試的次數都差不多了，這就是這一題的精髓了，那就是上面的所有的想法，都是我們把總共 `n` 層樓，分成 `k` 等分，每一等分都數量都一樣，可是每一等分的數量相同這件事情不是必須的，這也就是最難想到的地方，如果我們要有 `x` 等分，每一個等分是應該要是 `x, x-1, x-2, ..., 1` ，才對，為什麼是這樣呢？因為第一等分的時候，代表我嘗試丟了一次雞蛋就碎了，接下來我要嘗試丟 x 樓，才能找到答案，如果在第二等份才碎掉，那要再嘗試的就是 `x - 1` 次才能知道答案，也就是每一個等分的搜尋，都會丟了 `x + 1` 次。

等分

該等分樓層數量

最少嘗試次數

1

x

1 + x

2

x-1

2 + x - 1 = 1 + x

3

x-2

3 + x - 2 = 1 + x

…

…

x

1

x + 1 = 1 + x

有了這個概念後，我們推導出結論，那就是總共的樓層數是 `n` ，其存在一個關係式是

$$
\begin{equation}\begin{gathered}n = x + (x-1) + (x-2)+ … + 2 + 1 \\\\ = 1 + 2 + … + x  \\\\ = \frac{x(x+1)}{2}\end{gathered} \end{equation}
$$

但是因為大樓的等分法是不可分割的，所以我們要找到的 `x` 其實應該是要找到符合以下條件的最小正整數 `x` ：

$$
\frac{x(x+1)}{2}     \geq n
$$

題目要問的就是對一元二次方程式 $x^2+x-2n = 0 $ 求解，一元二次方程式的求解公式為：

$$
x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}
$$

其中題目 $a = 1, b = 1, c = -2n $ ，因此題目可以用以下方式來求解：

```python
class Solution:
    def twoEggDrop(self, n: int) -> int:
        a = 1
        b = 1
        c = - 2 * n

        x = (-b + (b * b - 4 * a * c)**0.5) / 2.0

        # 如果 x 是整數，則直接是答案，如果不是整數，需要向上取整。
        if x - int(x) == 0 :
            return int(x)
        return int(x) + 1

```

一直到了這裡段落都是在講數學問題，如果是雙蛋的問題，那我們的確可以針對方程式求解，而且我們目前也僅止討論到了雞蛋數量是一顆、兩顆和無限顆的三種情況，如果蛋的數量不定的話，又要如何求解呢？也就是這個題目是不是可以泛化成一個程式來求解？

於是再度跳回來看這個題目的設定，如果我從「任意」的一個樓層開始丟雞蛋，都一定會發生有以下任一種情況，破，或是沒有破，咦？這不是前面的二分法嗎？沒錯，前面的二分法只討論了如果一開始就破了，那最糟的情況需要投幾次，可是我們並沒有繼續討論到如果沒有破的情況是怎麼樣，其實如果一直討論下去，其實就一定會討論到在每一層，到底丟了幾次，並且討論到不同分法的情況，而這個過程就是一個遞迴的方程式如下。

$$
\begin{gathered}floor_{i} = max\\{f(i-1, eggs-1), f(n-i, eggs)\\} + 1  \\\\ f(n, eggs) = min\\{floor_{1}, floor_{2}, ..., floor_{i}, ... floor_{n} \\}\end{gathered}
$$

```python
class Solution:
    def superEggDrop(self, k: int, n: int) -> int:
        if k <= 1:
            return n
        if n == 0:
            return 0
        return min([max(self.superEggDrop(k-1, i-1), self.superEggDrop(k, n-i) + 1) for i in range(1, n+1)])

```

不過上面這個程式就存在著很多的重疊子問題，因此可以用記憶法的方式來搜尋如下，不過在 LeetCode 上，這樣的做法還是會「超時」！這一題要一路寫完真的是非常的折騰。

```python
class Solution:
    def superEggDrop(self, k: int, n: int) -> int:

        memo = {}
        def dp(k, n):
            if k == 1: return n
            if n == 0: return 0
            if (k, n) in memo:
                return memo[(k, n)]
            res = float('inf')
            for i in range(1, n+1):
                res = min(res, max(dp(k - 1, i - 1), dp(k, n - i)) + 1)
            memo[(k, n)] = res
            return memo[(k, n)]

        return dp(k, n)

```

### TODO

透過二分搜索來加速

```python
class Solution:
    def superEggDrop(self, k: int, n: int) -> int:

        memo = {}
        def dp(floors, eggs):
            if eggs == 1: return floors
            if floors == 0: return 0
            if (floors, eggs) in memo:
                return memo[(floors, eggs)]
            res = float('inf')
            lo, hi = 1, floors
            while lo <= hi:
                mid = (lo + hi) // 2
                broken = dp(mid - 1, eggs - 1)
                not_broken = dp(floors - mid, eggs)
                if broken > not_broken:
                    hi = mid - 1
                    res = min(res, broken + 1)
                else:
                    lo = mid + 1
                    res = min(res, not_broken + 1)

            memo[(floors, eggs)] = res
            return memo[(floors, eggs)]

        return dp(n, k)

```