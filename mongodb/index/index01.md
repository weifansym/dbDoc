索引是提高查询查询效率最有效的手段。索引是一种特殊的数据结构，索引以易于遍历的形式存储了数据的部分内容（如：一个特定的字段或一组字段值），索引会按一定规则对存储值进行排序，而且索引的存储位置在内存中，所在从索引中检索数据会非常快。如果没有索引，MongoDB必须扫描集合中的每一个文档，这种扫描的效率非常低，尤其是在数据量较大时。

### Create an Index（创建索引）
mongodb使用createIndex创建索引，对于已存在的索引可以使用reIndex()进行重建。
语法结构：
```
db.collection.createIndex(keys, options)
```
具体参数请看官网：https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#db.collection.createIndex
* keys: 要建立索引的参数列表。如：{KEY:1}，其中key表示字段名，1表示升序排序，也可使用使用数字-1降序。
* options: 可选参数，表示建立索引的设置。可选值如下：
    * background: 
    * unique: 
    * name: 
    * partialFilterExpression:
    * sparse:
    * expireAfterSeconds:
    * storageEngine:   
如，为集合newsflashes建立索引：
```
db.getCollection('newsflashes').createIndex({postTime: 1})
返回值如下：
{
    "createdCollectionAutomatically" : false,
    "numIndexesBefore" : 1,
    "numIndexesAfter" : 2,
    "ok" : 1.0
}
```
### reIndex (重建索引reIndex)
```
db.COLLECTION_NAME.reIndex()
```
如，重建集合sites的所有索引：
```
> db.sites.reIndex()
{
  "nIndexesWas" : 2,
  "nIndexes" : 2,
  "indexes" : [
    {
	  "key" : {
		"_id" : 1
	  },
	  "name" : "_id_",
		"ns" : "newDB.sites"
	},
	{
	  "key" : {
		"name" : 1,
		"domain" : -1
	  },
	  "name" : "name_1_domain_-1",
	  "ns" : "newDB.sites"
	}
  ],
  "ok" : 1
}
```
### 查看索引
MongoDB提供了查看索引信息的方法：getIndexes()方法可以用来查看集合的所有索引，totalIndexSize()查看集合索引的总大小，db.system.indexes.find()查看数据库中所有索引信息。
#### 查看集合中的索引getIndexes()
```
db.COLLECTION_NAME.getIndexes()
```
如，查看集合sites中的索引：
```
>db.sites.getIndexes()
[
  {
	"v" : 1,
	"key" : {
	  "_id" : 1
	},
	"name" : "_id_",
	"ns" : "newDB.sites"
  },
  {
	"v" : 1,
	"key" : {
	  "name" : 1,
	  "domain" : -1
	},
	"name" : "name_1_domain_-1",
	"ns" : "newDB.sites"
  }
]
```
#### 查看集合中的索引大小totalIndexSize()
```
db.COLLECTION_NAME.totalIndexSize()
```
如，查看集合sites索引大小：
```
> db.sites.totalIndexSize()
16352
```
#### 查看数据库中所有索引db.system.indexes.find()
```
db.system.indexes.find()
```
如，当前数据库的所有索引：
```
> db.system.indexes.find()
```
### 删除索引
不在需要的索引，我们可以将其删除。删除索引时，可以删除集合中的某一索引，可以删除全部索引。
#### 删除指定的索引dropIndex()
```
db.COLLECTION_NAME.dropIndex("INDEX-NAME")
```
