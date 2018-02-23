##  MongoDB index(索引)
索引是一种特殊的数据结构，以一种简单的方式存储数据集合的一小部分内容。索引存储指定的字符或者字符集，并按照字符进行排序，
索引的顺序完全支持字符相等匹配与范围查询。另外MongoDB通过使用索引的顺序来返回结果数据。

下面描述了一个查询，使用索引查询和排序匹配的文档。
![https://docs.mongodb.com/manual/_images/index-for-sort.bakedsvg.svg](https://docs.mongodb.com/manual/_images/index-for-sort.bakedsvg.svg)
从根本上来说MongoDB中的索引和其他数据库系统中的索引是一样的。MongoDB是在集合级别定义索引，在集合中支持任何字段以及文档的子字段。

### Default _id Index（默认的_id索引）
MongoDB在你创建集合的时候会在_id字段上创建一个唯一索引，这个_id索引是为了防止在一个集合中存储两个相同具有_id的文档，在_id字段上你是不能够删除这个索引的。
### Create an Index
在Mongo shell中使用 db.collection.createIndex()来创建索引
```
db.collection.createIndex( <key and index type specification>, <options> )
```
下面的例子在name字段上创建了一个单一的键来描述索引
```
db.collection.createIndex( { name: -1 } )
```
db.collection.createIndex()方法仅仅用来在相同索引不存在的情况下创建索引。

mongodb的索引使用B-tree数据结构
### Index Types (索引类型)
mongdb提供了多种数据类型来支持查询和不同的数据类型
#### Single Field-简单字符

