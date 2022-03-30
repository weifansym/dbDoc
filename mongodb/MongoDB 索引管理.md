## MongoDB 索引管理
在数据量超大的情形下，任何数据库系统在创建索引时都是一个耗时的大工程。MongoDB 也不例外。MongoDB 索引的创建有两个选择：一个是前台方式，一个是后台方式。
### 创建索引
#### 索引创建方式
前台方式 (缺省)
```
缺省情况下，当为一个集合创建索引时，这个操作将阻塞其他的所有操作。
即该集合上的无法正常读写，直到索引创建完毕任意基于所有数据库申请读或写锁都将等待直到前台完成索引创建操作。
```
#### 后台方式
```
将索引创建置于到后台，适用于那些需要长时间创建索引的情形
这样在创建索引期间，MongoDB依旧可以正常的提供读写操作服务
等同于关系型数据库在创建索引的时候指定online,而MongoDB则是指定background,其目的都是相同的
即在索引创建期间，尽可能的以一种占用较少的资源方式来实现，同时又可以提供读写服务。
后台创建方式的代价：索引创建时间变长。
```
### 语法结构
MongoDB 创建索引使用 ensureIndex() 方法。
```
db.COLLECTION_NAME.ensureIndex(keys[,options])
```
Keys ： 要创建的索引字段
* 1 按升序创建索引
* -1 按降序来创建索引

#### 可选参数
<img width="798" alt="截屏2022-03-10 上午9 54 19" src="https://user-images.githubusercontent.com/6757408/157572744-f2c66cec-8e9f-4017-ab9d-7debad26aeba.png">

#### 后台创建范例

```
db.COLLECTION_NAME.ensureIndex({name: 1, age: 1}, {background: true});
```
通过在创建索引时加 **background:true** 选项，让创建工作在后台执行。

使用索引和不使用差距很大，合理使用索引，一个集合适合做 4-5 个索引。
#### 查看索引创建进度
可使用 db.currentOp() 命令观察索引创建的完成进度。
```
> db.currentOp({
          $or: [
            { op: "command", "query.createIndexes": { $exists: true } },
            { op: "insert", ns: /\.system\.indexes\b/ }
          ]
});
```
#### 终止索引的创建
```
db.killOp();
```
### 查看索引
MongoDB 提供了查看索引信息的方法：
* getIndexes()：查看集合的所有索引；
* totalIndexSize()：查看集合索引的总大小；
* db.system.indexes.find()：查看数据库中所有索引信息。

#### 查看集合中的索引 getIndexes ()
```
db.COLLECTION_NAME.getIndexes();
```
#### 查看集合中的索引大小 totalIndexSize ()
```
db.COLLECTION_NAME.totalIndexSize();
```
#### 查看数据库中所有索引 db.system.indexes.find ()
```
db.system.indexes.find();
```
### 删除索引
不再需要的索引，可以将其删除。删除索引时，可以删除集合中的某一索引，也可以删除全部索引。

#### 删除指定的索引 dropIndex ()
```
db.COLLECTION_NAME.dropIndex("INDEX-NAME");
```
#### 删除所有索引 dropIndexes ()
```
db.COLLECTION_NAME.dropIndexes();
```
#### 重建索引
数据表经多次修改后导致文件产生空洞，索引文件也是如此。因此可通过重建索引来提高索引的查询效率，类似 MySQL 的 optimize 表。根据 MongoDB 文档，通常不需要定期重建索引，且始终在前台构建索引。

官网文档可查看：https://docs.mongodb.com/manual/reference/command/reIndex/
```
// 该方法的调用不接受任何的参数
db.COLLECTION_NAME.reIndex();
```
