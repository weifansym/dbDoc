## 常用update操作
### mongodb中直接根据某个字段更新另外一个字段值
例如people表：
```
{
    "_id" : ObjectId("5b87d053705715430ea84ed5"),
    "name" : "Ale",
    "phone" : "1111111",
    "createTime" : ISODate("2018-08-30T19:46:21.243Z")
}

/* 2 */
{
    "_id" : ObjectId("5b87d053705715430ea84ed6"),
    "name" : "Cla",
    "phone" : "+55 53 8402 8510",
    "createTime" : ISODate("2019-06-05T11:32:15.928Z")
}
```
通过光标操作：[forEach](https://docs.mongodb.com/manual/reference/method/cursor.forEach/#cursor.forEach),进行赋值
```
db.getCollection('people').find({}).forEach(function (item) {
	db.getCollection('people').update({"_id":item._id},{"$set": {"updateTime": item.createTime }}, false, true)
} )
```
结果如下：
```
{
    "_id" : ObjectId("5b87d053705715430ea84ed5"),
    "name" : "Ale",
    "phone" : "1111111",
    "createTime" : ISODate("2018-08-30T19:46:21.243Z"),
    "updateTime" : ISODate("2018-08-30T19:46:21.243Z")
}

/* 2 */
{
    "_id" : ObjectId("5b87d053705715430ea84ed6"),
    "name" : "Cla",
    "phone" : "+55 53 8402 8510",
    "createTime" : ISODate("2019-06-05T11:32:15.928Z"),
    "updateTime" : ISODate("2019-06-05T11:32:15.928Z")
}
```
### mongodb增加修改字段
增加字段 : "Season"
```
{ $set: { <field1>: <value1>, ... } }
```
修改字段名称 : "team"→"NBA Team"
```
{$rename: { <field1>: <newName1>, <field2>: <newName2>, ... } }
```
mongo-shell完整示例代码：
```
use nba
db.createCollection(players)
db.players.insert({"team":"Cleveland","firstname":"Irving","lastname":"Kyrie"})
db.players.update({"firstname":"Irving"},{$set:{"team":"Cletics","Season":"2017~2018"}})
db.players.update({"firstname":"Irving"},{$rename:{"team":"NBA Team"}})
```
记录一下数据变化：
```
{ "_id" : ObjectId("59a1a734c8143c78793d3da6"), "firstname" : "Irving", "lastname" : "Kyrie", "team" : "Cleveland" }
{ "_id" : ObjectId("59a1a734c8143c78793d3da6"), "firstname" : "Irving", "lastname" : "Kyrie", "team" : "Cletics", "Season" : "2017~2018" }
{ "_id" : ObjectId("59a1a734c8143c78793d3da6"), "firstname" : "Irving", "lastname" : "Kyrie", "NBA Team" : "Cletics", "Season" : "2017~2018" }
```
