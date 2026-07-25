---
slug: "242-valid-anagram"
section: "coding"
title: "242. Valid Anagram"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674972901
updated_at: 1674972901
published_at: 1674972901
---
[242\. Valid Anagram](https://leetcode.com/problems/valid-anagram/)

Anagram 有一個特性就是只要是 Anagram 每個字元的字數都會一樣多，因此一個解法是先計算出一個單字每個字元所出現的次數，接著是再見去另外一個單字，有出現的字元的字數。

如果中間有發現其他的字元，就代表不是 Anagram 。

最後還要再記得檢查，有沒有哪個字元有在第一個單字有出現，但是第二個單字沒有出現。

{% tabs %} {% tab title="Python" %}

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        table = defaultdict(int)
        for char in s:
            table[char] += 1

        for char in t:
            if table[char] > 0:
                table[char] -= 1
            else:
                return False

        for key in table.keys():
            if table[key] != 0:
                return False

        return True

```

{% endtab %}

{% tab title="Java" %}

```java
class Solution {
    public boolean isAnagram(String s, String t) {
        final Map<String, Integer> map = new HashMap();
        for (final String c : s.split("")) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }

        for (final String d : t.split("")) {
            if (map.containsKey(d)) {
                map.put(d, map.get(d) - 1);
            } else {
                return false;
            }
        }

        for (final Map.Entry<String, Integer> entry : map.entrySet()) {
            if (entry.getValue() != 0) {
                return false;
            }
        }

        return true;
    }
}

```

{% endtab %} {% endtabs %}