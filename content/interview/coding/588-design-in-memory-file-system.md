---
slug: "588-design-in-memory-file-system"
section: "coding"
title: "588. Design In-Memory File System"
status: "published"
pinned: false
tags: ["Trie"]
created_at: 1674972935
updated_at: 1674972935
published_at: 1674972935
---
[588\. Design In-Memory File System](https://leetcode.com/problems/design-in-memory-file-system/)

```python
class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode)
        self.isDir = True
        self.content = ''       

class FileSystem:

    def __init__(self):
        self.root = TrieNode()

    def find(self, path):
        node = self.root
        if path == '/':
            return node
        else:
            for name in path.split('/')[1:]:
                node = node.children[name]
            return node

    def ls(self, path: str) -> List[str]:
        node = self.find(path)
        if node.isDir:
            return sorted(node.children.keys())
        else:
            return [path.split('/')[-1]]

    def mkdir(self, path: str) -> None:
        self.find(path)

    def addContentToFile(self, filePath: str, content: str) -> None:
        node = self.find(filePath)
        node.isDir = False
        node.content += content

    def readContentFromFile(self, filePath: str) -> str:
        node = self.find(filePath)
        return node.content

# Your FileSystem object will be instantiated and called as such:
# obj = FileSystem()
# param_1 = obj.ls(path)
# obj.mkdir(path)
# obj.addContentToFile(filePath,content)
# param_4 = obj.readContentFromFile(filePath)

```