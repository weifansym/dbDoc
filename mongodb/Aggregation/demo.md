## Aggregation pipeline demo
### (Data Model)数据模型
假设一个体育俱乐部有一个数据库，这个数据库有一个users集合。这个集合包含了用户加入的时间，喜好，这些保存至如下：
```
{
    "_id" : "jane",
    "joined" : ISODate("2011-03-02T00:00:00.000Z"),
    "likes" : [ 
        "golf", 
        "racquetball"
    ]
}

{
    "_id" : "joe",
    "joined" : ISODate("2012-07-02T00:00:00.000Z"),
    "likes" : [ 
        "tennis", 
        "golf", 
        "swimming"
    ]
}
```
### 格式化和排序文档
下面返回用户的大写姓名，并按字母排序，这个聚合包含了users集合中所有文档的所有用户名，你可以使用下面的方式来格式化用户名：
```
db.users.aggregate(
  [
    { $project : { name:{$toUpper:"$_id"} , _id:0 } },
    { $sort : { name : 1 } }
  ]
)
```
所有users集合中的文档通过管道进行传递，管道包含如下操作：
*  $project操作：
   * 创建一个name字段
   * 通过 $toUpper操作，把_id的值转化成大写，然后$project操作创建一个name字段来保留这个值。
   * 限制id字段：$project操作默认传递_id字段，除非有明确的指定
* $sort操作：根据名字来操作结果
结果如下：
```
{
  "name" : "JANE"
},
{
  "name" : "JILL"
},
{
  "name" : "JOE"
}
```
### 通过加入月份进行排序，只返回用户名
下面的聚合操作通过加入月份进行排序，只返回用户名,这个操作能够帮助生成会员续期的通知。
```
db.users.aggregate(
  [
    { $project :
       {
         month_joined : { $month : "$joined" },
         name : "$_id",
         _id : 0
       }
    },
    { $sort : { month_joined : 1 } }
  ]
)
```
所有users集合中的文档通过管道进行传递，管道包含如下操作：
*  $project操作:
   * 创建两个新字段：month_joined 和 name
   * 限制id字段：$project操作默认传递_id字段，除非有明确的指定
* $month操作：把joined字段的值转化成整型的月份值，接着$project把值赋值给month_joined字段
* $sort操作：通过month_joined字段进行排序
结果如下：
```
{
  "month_joined" : 1,
  "name" : "ruth"
},
{
  "month_joined" : 1,
  "name" : "harold"
},
{
  "month_joined" : 1,
  "name" : "kate"
}
{
  "month_joined" : 2,
  "name" : "jill"
}
```
