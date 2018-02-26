索引是提高查询查询效率最有效的手段。索引是一种特殊的数据结构，索引以易于遍历的形式存储了数据的部分内容（如：一个特定的字段或一组字段值），索引会按一定规则对存储值进行排序，而且索引的存储位置在内存中，所在从索引中检索数据会非常快。如果没有索引，MongoDB必须扫描集合中的每一个文档，这种扫描的效率非常低，尤其是在数据量较大时。

## Create an Index（创建索引）
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
