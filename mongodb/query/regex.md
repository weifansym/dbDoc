### $regex
[官网地址](https://docs.mongodb.com/manual/reference/operator/query/regex/index.html):对于查询匹配的字符串提供正则表达式的能力，
具体语法见文档描述。
### $options
正则表达式中的可选参数，可以设置如下选项：
* i: 查询匹配不区分大小写
* m: 对于包含锚点的模式（即^表示开头，$表示结尾），在每行的开头或结尾匹配具有多行值的字符串。 如果没有此选项，这些锚点将在字符串的开头或结尾处匹配
* x: 
* s: 允许点号字符匹配任何字符包括换行符
## 用法
### $in表达式
在$in查询表达式里使用正则表达式，你只可以使用javascript正则表达式对象。
```
{ name: { $in: [ /^acme/i, /^ack/ ] } }
```
这里的**$in**可以根据多个查询条件进行正则匹配。但是要注意：在$in表达式中不可使用$regex表达式。

对于一个字段的逗号列表中包含正则表达式的查询条件，可以使用$regex操作。
```
{ name: { $regex: /acme.*corp/i, $nin: [ 'acmeblahcorp' ] } }
{ name: { $regex: /acme.*corp/, $options: 'i', $nin: [ 'acmeblahcorp' ] } }
{ name: { $regex: 'acme.*corp', $options: 'i', $nin: [ 'acmeblahcorp' ] } }
```
例子中的$nin表示不包含这些特定的值。
### x and s Options
正则表达式中多个可选的参数，需要使用$options操作符。
```
{ name: { $regex: /acme.*corp/, $options: "si" } }
{ name: { $regex: 'acme.*corp', $options: "si" } }
```
### $regex and $not
在$not中也可以使用正则表达式。方法如下：
```
db.inventory.find( { item: { $not: /^p.*/ } } )
db.inventory.find( { item: { $not: { $regex: "^p.*" } } } )
db.inventory.find( { item: { $not: { $regex: /^p.*/ } } } )
```
### 索引的使用
对于区分大小写的字段，正则表达式可以使用索引，特别是前缀索引可以显著的提高性能。前缀搜索引就是以（^）开头或者左边使用（\A）。
对于大小写不敏感的字段是不能使用索引的。
### Perform a LIKE Match
```
db.products.find( { sku: { $regex: /789$/ } } )
```
上面等内容等价于sql语句中的
```
SELECT * FROM products
WHERE sku like "%789";
```
### 其他
正则表达式中如果没有锚点，比如^,$等字符，则为全局匹配，例如：
```
db.products.find( { description: { $regex: /S/ } } )
```
匹配description中的所有S
