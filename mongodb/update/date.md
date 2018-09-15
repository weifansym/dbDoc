## 时间更改
存在MongoDB中的时间是ISODate,是一个标准的啥时间，比北京时间大了8小时，所以在更改时间的时候要注意，减去8小时。更改的具体方式如下： 
```
db.getCollection("articles").update({
  "_id" : ObjectId("5b9b7f712a025e1fda4e9011")
}, {
  $set: {"time" : ISODate("2018-09-11 18:05:36")}
});
```
