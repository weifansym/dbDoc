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
通过光标操作：forEach,进行赋值
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

