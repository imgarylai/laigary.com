---
slug: "271-encode-and-decode-strings"
section: "coding"
title: "271. Encode and Decode Strings"
status: "published"
pinned: false
tags: ["Object Oriented Design"]
created_at: 1674972901
updated_at: 1709523540
published_at: 1674972901
---
[271\. Encode and Decode Strings](https://leetcode.com/problems/encode-and-decode-strings/)

這個題目的目的是要做到文字的轉碼，這個技術其實滿常見於資料的傳輸，因為資料在傳輸的時候是沒辦法保留原先的資料格式的，例如我們有一個陣列要傳輸，這個陣列一定要先經過轉碼後變成一串長文字才方便在網路上傳輸。

但是當接收方收到後，要怎麼知道原本的檔案格式，在 http 裡面，就會在轉碼時，就會在每個文字前面，用一個空間來放一些資訊，例如：我利用一個3個字元的空間，紀錄總共有幾個字，在這個題目當中，一個字最長不會超過 200 的字元，所以我可以在文字前面使用三個字元的空間，紀錄說接下來的這個文字有多長。

例如：

-   `['hello', 'word']` -> `005hello004word`

也就是說每次都會讀一個固定的記憶體大小來得知資訊。

```python
class Codec:
    def __init__(self, size = 3):
        self.size = size

    def encode(self, strs: [str]) -> str:
        """Encodes a list of strings to a single string.
        """
        res = ''

        for s in strs:
            chunk_size = len(s)
            meta = str(len(s)).zfill(self.size)
            res += meta + s

        return res


    def decode(self, s: str) -> [str]:
        """Decodes a single string to a list of strings.
        """
        res = []
        i = 0

        while i < len(s):
            meta = s[i:i+self.size]
            chunk_size = int(meta)
            i += self.size
            string = s[i:i+chunk_size]
            res.append(string)
            i += chunk_size

        return res




# Your Codec object will be instantiated and called as such:
# codec = Codec()
# codec.decode(codec.encode(strs))

```