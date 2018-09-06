## Schema Options
Schema有一些可选的配置，可以直接传递给构造器或者set。
```
new Schema({..}, options);

// or

var schema = new Schema({..});
schema.set(option, value);
```
下面我们来一一了解下：
### option: autoIndex
在程序启动的时候mongoose对于每一个在schema中声明的index,都会发送createIndex命令。截至Mongoose v3，索引都是在后端默认创建的。如果你想要关闭这个
功能或者想手动管理这个index的创建。设置Schema中的autoIndex选项为false,或者在你的model上面使用 ensureIndexes方法。
```
var schema = new Schema({..}, { autoIndex: false });
var Clock = mongoose.model('Clock', schema);
Clock.ensureIndexes(callback);
```
### option: bufferCommands
当连接断开时，mongoose缓冲命令，直到驱动程序设法重新连接。同样也可以通过设置bufferCommands来管理他。
```
var schema = new Schema({..}, { bufferCommands: false });
```
schema中的bufferCommands将会覆盖全局的bufferCommands
```
mongoose.set('bufferCommands', true);
// Schema option below overrides the above, if the schema option is set.
var schema = new Schema({..}, { bufferCommands: false });
```
### option: capped
其实就是用来设置MongoDB中集合的大小，这个大小是按照byte来计算的。
```
new Schema({..}, { capped: 1024 });
```
具体看：mongoose的官网
### option: collection
mongoose默认生成集合名字通过传递model名给 utils.toCollectionName方法，这个方法会产生一个复数化的model名字作为集合名。
如果想为你的集合设置不同的名字，可以通过这个选项：
```
var dataSchema = new Schema({..}, { collection: 'data' });
```
### option: id
mongonose为每一个文档赋值一个id虚拟的getter方法，他返回文档的_id字段，并把它强制转换成字符串,在ObjectIds的情况下，它的hexString。如果你不希望
这个id的getter方法添加到你的schema上，可以再构建schema的时候传递这个可选值。例如
```
// default behavior
var schema = new Schema({ name: String });
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p.id); // '50341373e894ad16347efe01'

// disabled id
var schema = new Schema({ name: String }, { id: false });
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p.id); // undefined
```
### option: _id
如果这个_id字段没有在schema结构中声明的话,mongoose默认为每一个文档赋值一个_id字段。_id的分配的类型是ObjectId，与MongoDB的默认行为一致。如果你不想
在你的文档中添加_id字段，你同样可以设置他。

你可以只把这个选项用在子文档中。mongoose在不知道文档id的情况下是无法存储这个文档的，所以如你要存储一个不带_id的文档将会抛出错误的。
```
// default behavior
var schema = new Schema({ name: String });
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p); // { _id: '50341373e894ad16347efe01', name: 'mongodb.org' }

// disabled _id
var childSchema = new Schema({ name: String }, { _id: false });
var parentSchema = new Schema({ children: [childSchema] });

var Model = mongoose.model('Model', parentSchema);

Model.create({ children: [{ name: 'Luke' }] }, function(error, doc) {
  // doc.children[0]._id will be undefined
});
```
### option: minimize
### option: read
### option: writeConcern
### option: safe
### option: shardKey
### option: strict
### option: strictQuery
### option: toJSON
与toObject选项完全相同，但仅在调用文档toJSON方法时适用。
```
var schema = new Schema({ name: String });
schema.path('name').get(function (v) {
  return v + ' is my name';
});
schema.set('toJSON', { getters: true, virtuals: false });
var M = mongoose.model('Person', schema);
var m = new M({ name: 'Max Headroom' });
console.log(m.toObject()); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom' }
console.log(m.toJSON()); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom is my name' }
// since we know toJSON is called whenever a js object is stringified:
console.log(JSON.stringify(m)); // { "_id": "504e0cd7dd992d9be2f20b6f", "name": "Max Headroom is my name" }
```
查看所有**toJSON/toObject**可用的选项，请看：[document_Document-toObject](https://mongoosejs.com/docs/api.html#document_Document-toObject)
### option: toObject
文档有toObject方法
### option: typeKey
### option: validateBeforeSave
### option: versionKey
### option: collation
### option: skipVersioning
### option: timestamps
### option: useNestedStrict
### 
