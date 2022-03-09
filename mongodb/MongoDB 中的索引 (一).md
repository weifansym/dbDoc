## MongoDB 中的索引 (一)
在 MongoDB 典型的数据库查询场景中，索引 index 扮演着非常重要的作用，如果没有索引，MongoDB 需要为了找到一个匹配的文档而扫描整个 collection，代价非常高昂。
### 实例
MongoDB 的索引使用的 B-tree 这一特殊的数据结构，借助索引 MongoDB 可以高效的匹配到需要查询的数据，以下图来为例 (来自官方)：
![image](https://user-images.githubusercontent.com/6757408/157474454-7a904372-4af9-470c-b5d7-ede3c49a450a.png)
score 索引不但可以高效的支持 range 查询，此外也可以让 MongoDB 高效地返回排序之后的数据，MongoDB 的索引同其它数据库系统很相似，MongoDB 的索引是定义在 collection 级别的，
支持对任何单个 field 以及任何 sub-field 建立索引。

### 默认的_id index
MongoDB 在 collection 创建时会默认建立一个基于_id 的唯一性索引作为 document 的 primary key，这个 index 无法被删除。
Mongodb 支持多种方式创建索引，具体创建方式见官方文档 https://docs.mongodb.com/manual/indexes/#create-an-index
### Single field index - 单索引
Single field index 是 MongoDB 最简单的索引类型，不同于 MySQL，MongoDB 的索引是有序的 ascending 或 descending。
![image](https://user-images.githubusercontent.com/6757408/157475188-11b31741-61c5-4f26-982f-c667354dc02d.png)
但是对于 single field index 来说，索引的顺序无关紧要，因为 MongoDB 支持任意顺序遍历 single field index。

在此创建一个 records collection：
```
{
  "_id": ObjectId("570c04a4ad233577f97dc459"),
  "score": 1034,
  "location": { state: "NY", city: "New York" }
}
```
然后创建一个 single field index：
```
db.records.createIndex( { score: 1 } )
```
上面的语句在 collection 的 score field 上创建了一个 ascending 索引，这个索引支持以下查询：
```
db.records.find( { score: 2 } )
db.records.find( { score: { $gt: 10 } } )
```
可以使用 MongoDB 的 explain 来对以上两个查询进行分析：
```
db.records.find({score:2}).explain('executionStats')
```
### single index on embedded field - 内嵌字段上的单索引
此外 MongoDB 还支持对 embedded field 进行索引创建：
```
db.records.createIndex( { "location.state": 1 } )
```
上面的 embedded index 支持以下查询：
```
db.records.find( { "location.state": "CA" } )
db.records.find( { "location.city": "Albany", "location.state": "NY" } )
```
### sort on single index - 单索引的排序
对于 single index 来说，由于 MongoDB index 本身支持顺序查找，所以对于 single index 来说:
```
db.records.find().sort( { score: 1 } )
db.records.find().sort( { score: -1 } )
db.records.find({score:{$lte:100}}).sort( { score: -1 } )
```
这些查询语句都是满足使用 index 的。
### Compound index - 组合索引
Mongodb 支持对多个 field 建立索引，称之为 compound index。Compound index 中 field 的顺序对索引的性能有至关重要的影响，比如索引 {userid:1, score:-1} 首先根据 userid 排序，
然后再在每个 userid 中根据 score 排序。
![image](https://user-images.githubusercontent.com/6757408/157475935-b6ebeeda-262f-487f-b188-fc24842fdf5c.png)
### 创建 Compound index
在此创建一个 products collection：
```
{
 "_id": ObjectId(...),
 "item": "Banana",
 "category": ["food", "produce", "grocery"],
 "location": "4th Street Store",
 "stock": 4,
 "type": "cases"
}
```
然后创建一个 compound index：
```
db.products.createIndex( { "item": 1, "stock": 1 } )
```
这个 index 引用的 document 首先会根据 item 排序，然后在 每个 item 中，又会根据 stock 排序，以下语句都满足该索引：
```
db.products.find( { item: "Banana" } )
db.products.find( { item: "Banana", stock: { $gt: 5 } } )
```
条件 {item: “Banana”} 满足是因为这个 query 满足 prefix 原则。
### 使用 compound index 需要满足 prefix 原则
Index prefix 是指 index fields 的左前缀子集，考虑以下索引：
```
{ "item": 1, "location": 1, "stock": 1 }
```
这个索引包含以下 index prefix：
```
{ item: 1 }
{ item: 1, location: 1 }
```
所以只要语句满足 index prefix 原则都是可以支持使用 compound index ：
```
db.products.find( { item: "Banana" } )
db.products.find( { item: "Banana",location:"4th Street Store"} )
db.products.find( { item: "Banana",location:"4th Street Store",stock:4})
```
相反如果不满足 index prefix 则无法使用索引，比如以下 field 的查询：

* the location field
* the stock field
* the location and stock fields

由于 index prefix 的存在，如果一个 collection 既有 {a:1, b:1} 索引 ，也有 {a:1} 索引，如果二者没有稀疏或者唯一性的要求，single index 可以移除。

### Sort on Compound index - 复合索引的排序
前文说过 single index 的 sort 顺序无关紧要，但是 compound index 则完全不同，考虑有如下场景：
```
db.events.find().sort( { username: 1, date: -1 } )
```
上面的查询首先根据 username 进行 ascending 排序，然后再对结果进行 date descending 。

下面的查询：
```
db.events.find().sort( { username: -1, date: 1 } )
```
则是首先根据 username 进行 descending 排序，然后再对 date 进行 ascending 排序。

如果想要索引满足以上两种查询和排序，索引类型需要满足如下条件：
```
db.events.createIndex( { "username" : 1, "date" : -1 } ）
```
也就是**username 和 date 的顺序不同，** 如果顺序相同则没有办法满足以上查询，比如：
```
db.events.find().sort( { username: 1, date: 1 })
```
也就是说 sort 的顺序必须要和创建索引的顺序是一致的，一致的意思是不一定非要一样，总结起来大致如下：
|  | { “username” : 1, “date” : -1 } | { “username” : 1, “date” : 1 } |
| ------------- | ------------- | ------------- |
| sort( { username: 1, date: -1 } )  | 支持  | 不支持  |
| sort( { username: -1, date: 1 } )  | 支持 | 不支持 |
| sort( { username: 1, date: 1 } )  | 不支持  | 支持  |
| sort( { username: -1, date: -1 } )  | 不支持 | 支持 |
即排序的顺序必须要和索引一致，逆序之后一致也可以，下表清晰的列出了 compound index 满足的 query 语句：

| query | index |
| ------------- | ------------- |
| db.data.find().sort( { a: 1 } )  | { a: 1 }  |
| db.data.find().sort( { a: -1 } )  | { a: 1 }  |
| db.data.find().sort( { a: 1, b: 1 } )  | { a: 1, b: 1 }  |
| db.data.find().sort( { a: -1, b: -1 } )  | { a: 1, b: 1 }  |
| db.data.find().sort( { a: 1, b: 1, c: 1 } )  | { a: 1, b: 1, c: 1 }  |
| db.data.find( { a: { $gt: 4 } } ).sort( { a: 1, b: 1 } )  | { a: 1, b: 1 }  |

即排序的 filed 也要满足 index prefix 原则。
### 非 index prefix 的排序
考虑索引 { a: 1, b: 1, c: 1, d: 1 }，**即使排序的 field 不满足 index prefix 也是可以的，但前提条件是排序 field 之前的 index field 必须是等值条件，

|  | Example | Index Prefix |
| ------------- | ------------- | ------------- |
| r1  | db.data.find( { a: 5 } ).sort( { b: 1, c: 1 } )  | { a: 1 , b: 1, c: 1 }  |
| r2  | db.data.find( { b: 3, a: 4 } ).sort( { c: 1 } ) | { a: 1, b: 1, c: 1 } |
| r3  | db.data.find( { a: 5, b: { $lt: 3} } ).sort( { b: 1 } )  | { a: 1, b: 1 }  |
上面表格 r1 的排序 field 是 b 和 c，a 是 index field 而且在 b 和 c 之前，可以使用索引；r3 的排序中 b 是范围查询，但是 b 之前的 a 用的也是等值条件，也就是只要排序 field 之前的 
field 满足等值条件即可，其它的 field 可以任意条件。

### 如何建立正确索引
前文基本覆盖了日常使用 MongoDB 所需要的主要索引知识，但是如何才建立正确的索引？

### 使用 explain 分析查询语句
MongoDB 默认提供了类似 MySQL explain 的语句来分析查询语句的来对我们正确建立索引提供帮助，在建立索引时我们需要对照 explain 对各种查询条件进行分析。
### 理解 field 顺序对索引的影响
索引的真正作用是帮助我们限制数据的选择范围，比如 Compound index 多个 feild 的顺序如何决定，应该首选可以最大化的缩小数据查找范围的 field，这样如果第一个 field 可以迅速缩小数据的查找范围，
那么后续的 feild 匹配的行就会变少很多。考虑语句：
```
{'start_time': {'$lte': present}, 'end_time': {'$gt': present}, 'origin': 1, 'orientation': 'quality', 'id': {'$gt': max_id}}
```
考虑如下索引

索引	nscanded	
r1	{start_time:1, end_time: 1, origin: 1, id: 1, orientation: 1}	12959
r2	{start_time:1, end_time: 1, origin: 1, orientation: 1, id: 1}	2700

|  | 索引 | nscanded |
| ------------- | ------------- | ------------- |
| r1  | {start_time:1, end_time: 1, origin: 1, id: 1, orientation: 1}  | 12959  |
| r2  | {start_time:1, end_time: 1, origin: 1, orientation: 1, id: 1} | 2700 |

由于 field id 和 orientation 的顺序不同会导致需要扫描的 documents 数量差异巨大，说明二者对对数据的限制范围差别很大，优先考虑能够最大化限制数据范围的索引顺序。

### 监控慢查询
始终对生成环境产生的慢查询进行第一时间分析，提早发现问题并解决。

### 参考资料
* https://docs.mongodb.com/manual/core/index-compound/
* http://www.infoq.com/cn/articles/improve-find-performance-in-mongo
