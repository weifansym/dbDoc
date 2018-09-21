## Query for Null or Missing Fields
在mongodb中不同的查询操作对待null的方式是不同的。这一章提供了一个查询null值的操作，操作在mongo shell中使用 db.collection.find()方法。
这一页的例子，使用inventory集合，inventory集合如下：
```
db.inventory.insertMany([
   { _id: 1, item: null },
   { _id: 2 }
])
```
### Equality Filter（相等过滤）
**{ item : null }**查询，匹配包含item字段的文档，item的值可以是null,也可以不存在此字段。
```
db.inventory.find( { item: null } )
```
该查询返回集合中的两个文档。
### Type Check（类型检查）
**{ item : { $type: 10 } }**查询，只匹配文档中包含item切这个值是null，例如：item字段的值是[BSON Type](https://docs.mongodb.com/manual/reference/bson-types/)的null（类型值是10）
```
db.inventory.find( { item : { $type: 10 } } )
```
这个查询只返回文档中item的值是null的文档。
### Existence Check(存在检查)
**{ item : { $exists: false } }**查询，匹配不包含item字段的文档：
```
db.inventory.find( { item : { $exists: false } } )
```
这个查询只包含不存在item字段的文档。

也可查看：
$type and $exists操作的文档
