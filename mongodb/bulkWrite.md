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

默认，bulkWrite()方法是有序操作的，定义无需操作需要在操作文档的时候设置:ordered : false

### bulkWrite() Methods
bulkWrite()支持下面的写操作：
```
insertOne
updateOne
updateMany
replaceOne
deleteOne
deleteMany
```
每一个写操作，做数组中作为一个文档传递给bulkWrite()方法。例如下面是多次写操作。

characters集合包含下面的文档：
```
{ "_id" : 1, "char" : "Brisbane", "class" : "monk", "lvl" : 4 },
{ "_id" : 2, "char" : "Eldon", "class" : "alchemist", "lvl" : 3 },
{ "_id" : 3, "char" : "Meldane", "class" : "ranger", "lvl" : 3 }

```

下面的bulkWrite方法对这个集合进行多次操作
```
try {
   db.characters.bulkWrite(
      [
         { insertOne :
            {
               "document" :
               {
                  "_id" : 4, "char" : "Dithras", "class" : "barbarian", "lvl" : 4
               }
            }
         },
         { insertOne :
            {
               "document" :
               {
                  "_id" : 5, "char" : "Taeln", "class" : "fighter", "lvl" : 3
               }
            }
         },
         { updateOne :
            {
               "filter" : { "char" : "Eldon" },
               "update" : { $set : { "status" : "Critical Injury" } }
            }
         },
         { deleteOne :
            { "filter" : { "char" : "Brisbane"} }
         },
         { replaceOne :
            {
               "filter" : { "char" : "Meldane" },
               "replacement" : { "char" : "Tanys", "class" : "oracle", "lvl" : 4 }
            }
         }
      ]
   );
}
catch (e) {
   print(e);
}

```
上面的操作返回值如下：
```
{
   "acknowledged" : true,
   "deletedCount" : 1,
   "insertedCount" : 2,
   "matchedCount" : 2,
   "upsertedCount" : 0,
   "insertedIds" : {
      "0" : 4,
      "1" : 5
   },
   "upsertedIds" : {

   }
}
```

### Strategies for Bulk Inserts to a Sharded Collection
大批量的插入操作，包括初始化的数据插入或者常规的数据导入，都会影响到分片集群（shared cluster）的性能，对于批量插入要考虑下面的策略：

#### Pre-Split the Collection(提前分片集合)
如果共享集合是空的，此时集合只有一个初始块，数据保留至一个分片上。MongoDB必须花时间接收数据，创建分片，对于可用的分片描述他们的分块。为了避免这个性能消耗，你可以对集合进行提前分片，具体请看:[split-chunks-in-sharded-cluster](https://docs.mongodb.com/manual/tutorial/split-chunks-in-sharded-cluster/)。

#### Unordered Writes to mongos(对mongos进行无序的写操作)
为了避免对分片的写入性能，在使用Bulk write进行写入的时候设置**ordered**为false。mongos会同时对多个分片发送写操作。对于空的集合首先应该预分片集合。

### Avoid Monotonic Throttling(避免单调节流)
如果你的分片的key再插入的时候单调增长，然后所有的插入值都进入了集合中最后一个块中，这样将会永远操作一个单一的分片。因此，集群插入的性能将不会超过这个单一的分片。
如果你插入的量超过了一个分片的处理能力，如果你不能够避免一个单调递增的分片key,那就要考虑在你程序中做下面的修改了。

* 反转二进制位的分片key,对于递增值序列，这样保护了信息，避免了关联插入顺序。
* 交换第一个和最后16位字符然后进行移动插入。

The following example, in C++, swaps the leading and trailing 16-bit word of [BSON ObjectIds](https://docs.mongodb.com/manual/reference/glossary/#term-objectid) generated so they are no longer monotonically increasing.
```
using namespace mongo;
OID make_an_id() {
  OID x = OID::gen();
  const unsigned char *p = x.getData();
  swap( (unsigned short&) p[0], (unsigned short&) p[10] );
  return x;
}

void foo() {
  // create an object
  BSONObj o = BSON( "_id" << make_an_id() << "x" << 3 << "name" << "jane" );
  // now we may insert o into a sharded collection
}
```

