## MongoDB时间相关
根据[官方文档](https://docs.mongodb.com/manual/reference/method/Date/), 在Mongodb内部存储时，Date被存储为一个64bit的整数，
代表从Unix epoch (Jan 1, 1970)开始的毫秒数，简单说Date被存储为一个整数时间戳，而在js脚本里则被转换为一个js Date类型。

时间戳是无关时区的，对于0时区就是和1970-01-01 00:00:00之差的毫秒数，而对于我们东八区，则是与1970-01-01 00:08:00之差的毫秒数。
也就是不管在哪个时区，同一时间的时间戳是一样的。

所以看上面的第一个问题，时间实际显示的UTC时间，所以和我们本地时间相差八小时。也就是不管输入的是什么，实际显示的都是UTC时间，而存储的是时间戳。

所以我们在mongo shell里构造时间时，就要注意了：
```
mongos> new Date('2017-10-22 16:11:00');
ISODate("2017-10-22T08:11:00Z")
mongos> new Date('2017-10-22 16:11:00Z');
ISODate("2017-10-22T16:11:00Z")
mongos> new Date('2017-10-22 16:11:00+08:00');
ISODate("2017-10-22T08:11:00Z")
```
可以看出，普通输入时间时，表示这是一个本地时间，会被转换为UTC时间存储，我们也可以后面加一个Z表示这就是一个UTC时间，也可以指明这个时间所在的时区，
最后也是转换为UTC时间。

从上面我们可以知道，MongoDB里面的ISODate时间是我们的本地时间早8小时的，即比我们本地的北京时间小8小时，这个在平时操作的时候一定要注意：

下面的例子都是在MongoShell里做的操作：
例如我们要查询24号到25号这一天的数据，
查询如下：
```
db.getCollection("moments_votes").find({createTime:{$gte:ISODate("2019-05-24 16:00:00"), $lte:ISODate("2019-05-25 16:00:00")}})
```
更新如下：
```
db.getCollection("articles").update({
  "_id" : ObjectId("5b9b7f712a025e1fda4e9011")
}, {
  $set: {"time" : ISODate("2018-09-11 18:05:36")}
});
```
插入如下：
```
db.getCollection("moments_users").insertMany([
	{
  uid: 277931,
  createTime: ISODate(),
  updateTime: new Date()
}
]);
```
其中ISODate()与new Date()结果相同。
