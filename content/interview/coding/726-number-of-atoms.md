---
slug: "726-number-of-atoms"
section: "coding"
title: "726. Number of Atoms"
status: "published"
pinned: false
tags: ["String"]
created_at: 1674972936
updated_at: 1674972936
published_at: 1674972936
---
[726\. Number of Atoms](https://leetcode.com/problems/number-of-atoms/)

這一題的關鍵在於我們要知道怎麼把元素與價數分離出來。

頗析出來後就是用遞迴的方式來寫。

```python
class Solution:
    def countOfAtoms(self, formula: str) -> str:
        self.i = 0
        def getName():
            name = formula[self.i]
            self.i += 1
            while self.i < len(formula) and formula[self.i].isalpha() and  formula[self.i].islower():
                name += formula[self.i]
                self.i += 1
            return name

        def getCount():
            digit = ''
            while self.i < len(formula) and formula[self.i].isdigit():
                digit += formula[self.i]
                self.i += 1
            return int(digit) if digit else 1

        def helper():
            counts = defaultdict(int)
            while self.i < len(formula):
                if formula[self.i] == '(':
                    self.i += 1
                    child_counts = helper()
                    count = getCount()
                    for key, val in child_counts.items():
                        counts[key] += val * count
                elif formula[self.i] == ')':
                    self.i += 1
                    return counts
                else:
                    name = getName()
                    counts[name] += getCount()
            return counts
        counts = helper()
        res = ''
        for key in sorted(counts.keys()):
            if counts[key] > 1:
                res += '{}{}'.format(key, counts[key])
            else:
                res += '{}'.format(key)
        return res

```