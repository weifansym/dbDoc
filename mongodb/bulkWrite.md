## Bulk Write Operations（批量写操作）

MongoDB提供给了客户端批量写的能力，批量写操作只占用一个MongoDB的链接，MongoDB允许程序决定Bulk write的确认等级.
db.collection.bulkWrite() 方法提供了批量insert，update，remove的操作。MongoDB也提供了使用db.collection.insertMany()进行批量插入的方法。

### 有序和无序的操作
批量写操作可以是有序也可以是无序的。

有顺序的操作列表，MongoDB串行执行这些操作，在处理的过程中如果一个出错，MongoDB将会退出操作，列表中余下的操作将不会执行。example如下：
[ordered Bulk Write](https://docs.mongodb.com/manual/reference/method/db.collection.bulkWrite/#bulkwrite-example-bulk-write-operation)

无序的操作列表：MongoDB会并行执行这些操作，但是这个操作没什么保障性，在操作列表里的操作如果有一个抛出错误，mongodb还会继续执行余下的操作。
example如下:[Unordered Bulk Write](https://docs.mongodb.com/manual/reference/method/db.collection.bulkWrite/#bulkwrite-example-unordered-bulk-write)

在一个共享连接上顺序执行操作将会比无序的操作慢很多，因为有序的操作必须要等到上一个操作完成之后再去执行下一个操作。

默认，bulkWrite()方法是有序操作的，定义无需操作需要
