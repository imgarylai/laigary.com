---
slug: "12-integer-to-roman"
section: "coding"
title: "12. Integer to Roman"
status: "published"
pinned: false
tags: ["String"]
created_at: 1674972898
updated_at: 1674972898
published_at: 1674972898
---
[12\. Integer to Roman](https://leetcode.com/problems/integer-to-roman/)

直接把規則寫出來

```python
class Solution:
    def intToRoman(self, num: int) -> str:
        if num >= 1000:
            return 'M' * int(num/1000) + self.intToRoman(num % 1000)
        elif num >= 900:
            return 'CM' + self.intToRoman(num % 100)
        elif num >= 500:
            return 'D' + 'C' * (int(num/100) - 5) + self.intToRoman(num % 100)
        elif num >= 400:
            return 'CD' + self.intToRoman(num % 100)
        elif num >= 100:
            return 'C' * int(num/100) + self.intToRoman(num % 100)
        elif num >= 90:
            return 'XC' + self.intToRoman(num % 10)
        elif num >= 50:
            return 'L' + 'X' * (int(num/10) - 5) + self.intToRoman(num % 10)
        elif num >= 40:
            return 'XL' + self.intToRoman(num % 10)
        elif num >= 10:
            return 'X' * (int(num/10)) + self.intToRoman(num % 10)
        elif num == 9:
            return 'IX'
        elif num >= 5:
            return 'V' + 'I' * (num - 5)
        elif num == 4:
            return 'IV'
        elif num >= 1:
            return 'I' * (num)
        elif num == 0:
            return ''

```