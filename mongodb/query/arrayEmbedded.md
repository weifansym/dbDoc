## 数组中内嵌文档的操作
### 查询一个内嵌在数组中的文档
下面的例子中查询所有文档中包含instock字段，且instock数组中包含给定内嵌文档的文档。
```
db.inventory.find( { "instock": { warehouse: "A", qty: 5 } } )
```
> 注意在那上面的匹配内嵌文档的时候，内嵌文档的字段的顺序会影响查询结果。
下面的查询结果和上面是不同的。
```
db.inventory.find( { "instock": { qty: 5, warehouse: "A" } } )
```
### 指定数组内嵌文档中某个字段作为查询条件
如果你不知道内嵌在数组中的文档的具体下表索引，可以通过数组字段然后点号链接内嵌文档字段的形式来查询。下面的例子查询所有文档中instock数组的内嵌文档中
至少有一个内嵌文档的qty的值小于等于20。
```
db.inventory.find( { 'instock.qty': { $lte: 20 } } )
```
### 使用数组下表来进行内嵌文档字段的查询
使用点号您可以在文档的特定索引或位置指定字段的查询条件，数组索引使用0开始。

下面查询所有具有instock数组且instock中包含一个内嵌文档，内嵌文档中的字段qty小于等于20，的所有文档。
```
db.inventory.find( { 'instock.0.qty': { $lte: 20 } } )
```
### 为数组中的文档指定多个条件
当指定多个字段在数组的内嵌文档上时，你可以指定查询，以便数组中单个文档满足这些条件或者任何文档组合（包括单个文档）满足这些条件。
#### 单个内嵌文档匹配多个查询条件在内嵌字段上
使用**$elemMatch**操作指定多个条件在数组的内嵌文档上，至少有一个数组的内嵌文档满足给定的多个条件。

举例如下：下面查询包含字段instock，且instock中的内嵌文档中至少有一个满足条件qty的值等于5且warehouse的值等于A的文档。
```
db.inventory.find( { "instock": { $elemMatch: { qty: 5, warehouse: "A" } } } )
```
下面查询包含字段instock，且instock中的内嵌文档中至少有一个满足条件qty的值大于10小于等于20的文档。
```
db.inventory.find( { "instock": { $elemMatch: { qty: { $gt: 10, $lte: 20 } } } } )
```
#### 文档组合满足给定的条件
如果在一个数组字段上进行组合查询的时候不使用**$elemMatch**，查询返回包含数组中满足条件的任意元素的组合的文档。

下面的查询中查询instock数组中任意一个内嵌文档中qty字段大于10，和任意一个文档(和前面满足条件的文档可以不是同一个)qty的值小于等于20。
```
db.inventory.find( { "instock.qty": { $gt: 10,  $lte: 20 } } )
```
下面的查询instock数组中至少有一个文档满足字段qty等于5，和至少有一个文档（和前面满足条件的文档可以不是同一个）字段warehouse的值是A。
```
db.inventory.find( { "instock.qty": 5, "instock.warehouse": "A" } )
```

数组操作：https://docs.mongodb.com/manual/reference/operator/query-array/

相关地址：https://docs.mongodb.com/manual/tutorial/query-array-of-documents/
