### 正确理解和使用 Mongodb 的索引
在 Mongodb 典型的数据库查询场景中，索引 index 扮演着非常重要的作用，如果没有索引，MongoDB 需要为了找到一个匹配的文档而扫描整个 collection，代价非常高昂。
Mongodb 的索引使用的 B-tree 这一特殊的数据结构，借助索引 Mongodb 可以高效的匹配到需要查询的数据，以下图来为例(来自官方)：
![index01](https://user-gold-cdn.xitu.io/2018/4/14/162c39eb85baeb73?imageslim)
score 索引不但可以高效的支持 range 查询，此外也可以让 MongoDB 高效地返回排序之后的数据。
Mongodb 的索引同其它数据库系统很相似，Mongodb 的索引是定义在 collection 级别的，支持对任何单个 field 以及任何 sub-field 建立索引。

### 默认的 _id index
Mongodb 在 collection 创建时会默认建立一个基于_id的唯一性索引作为 document 的 primary key，这个 index 无法被删除。
Mongodb 支持多种方式创建索引，具体创建方式见官方文档 https://docs.mongodb.com/manual/indexes/#create-an-index

### Single field index
Single field index 是 Mongodb 最简单的索引类型，不同于 MySQL，MongoDB 的索引是有顺序 ascending或 descending。
![index02](https://user-gold-cdn.xitu.io/2018/4/14/162c39eb855fdc37?imageslim)
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
### single index on embedded field
此外 MongoDB 还支持对 embedded field 进行索引创建：
```
db.records.createIndex( { "location.state": 1 } )
```
上面的 embedded index 支持以下查询：
```
db.records.find( { "location.state": "CA" } )
db.records.find( { "location.city": "Albany", "location.state": "NY" } )
```
### sort on single index
对于 single index 来说，由于 MongoDB index 本身支持顺序查找，所以对于single index 来说
```
db.records.find().sort( { score: 1 } )
db.records.find().sort( { score: -1 } )
db.records.find({score:{$lte:100}}).sort( { score: -1 } )
```
这些查询语句都是满足使用 index 的。
### Compound index
Mongodb 支持对多个 field 建立索引，称之为 compound index。Compound index 中 field 的顺序对索引的性能有至关重要的影响，
比如索引 {userid:1, score:-1} 首先根据 userid 排序，然后再在每个 userid 中根据 score 排序。
![index03](https://user-gold-cdn.xitu.io/2018/4/14/162c39eb8a9892cd?imageslim)
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
条件 {item: "Banana"} 满足是因为这个 query 满足 prefix 原则。

### 使用 compound 索引需要满足 prefix 原则
Index prefix 是指 index fields 的左前缀子集，考虑以下索引：
```
{ "item": 1, "location": 1, "stock": 1 }
```
这个索引包含以下 index prefix：
```
{ item: 1 }
{ item: 1, location: 1 }
```
所以只要语句满足 index prefix 原则都是可以支持使用 compound index 的：
```
db.products.find( { item: "Banana" } )
db.products.find( { item: "Banana",location:"4th Street Store"} )
db.products.find( { item: "Banana",location:"4th Street Store",stock:4})
```
相反如果不满足 index prefix 则无法使用索引，比如以下 field 的查询：

* the location field
* the stock field
* the location and stock fields

由于 index prefix 的存在，如果一个 collection 既有 {a:1, b:1} 索引 ，也有 {a:1} 索引，如果二者没有稀疏或者唯一性的要求，single index 是可以移除的。
Sort on Compound index
前文说过 single index 的 sort 顺序无关紧要，但是 compound index 则完全不同。
考虑有如下场景：
```
db.events.find().sort( { username: 1, date: -1 } )
```
events collection 有一个上面的查询，首先结果根据 username 进行 ascending 排序，然后再对结果进行 date descending 排序，或者是下面的查询：
```
db.events.find().sort( { username: -1, date: 1 } )
````
username 进行 descending 排序，然后再对 date 进行 ascending 排序，索引：
```
db.events.createIndex( { "username" : 1, "date" : -1 } ）
```
可以支持这两种查询，但是下面的查询不支持：
```
db.events.find().sort( { username: 1, date: 1 })
```
也就是说 sort 的顺序必须要和创建索引的顺序是一致的，一致的意思是不一定非要一样，总结起来大致如下

参考：https://juejin.im/post/5ad1d2836fb9a028dd4eaae6

