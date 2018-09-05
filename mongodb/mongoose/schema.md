## mongoose schema相关知识点
每一个schema都是对MongoDB中的集合的映射，注意不是文档哦，schema定义了集合中文档的形态。schema不仅仅包括文档的结构，而且还包括了文档初始化方法，
静态Model类型，索引，文档声明周期中间件钩子等。下面我们来一一了解。

### Defining your schema
在定义schema的时候具体要关注的就是schema中字段的类型了，即[SchemaType](https://mongoosejs.com/docs/schematypes.html)。
下面来看一下官方给的demo：构建了一个**blogSchema**
```
var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var blogSchema = new Schema({
    title:  String,
    author: String,
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
      votes: Number,
      favs:  Number
    }
  });
```
### Creating a model
使用我们的schema定义，就需要我们把定义的schema导入到model中。两者关联语句如下：
```
mongoose.model(modelName, schema):
```
> 注意上面这种方式只在mongoose使用默认链接的方式中，对于通过createConnection方法创建的链接构建model时需要使用这个链接来构建model.
> 例如，链接blogConn,构建关联操作语句如下：blogConn.model(modelName, schema):
### Instance methods
Models的实例就是文档，文档都有许多他内置的一些方法，其实我们也可以自定义我们的文档实例方法。例如：
```
// define a schema
  var animalSchema = new Schema({ name: String, type: String });

  // assign a function to the "methods" object of our animalSchema
  animalSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Animal').find({ type: this.type }, cb);
  };
```
现在我们的所有的animal实例都有了一个可用的findSimilarTypes方法。示例如下：
```
var Animal = mongoose.model('Animal', animalSchema);
  var dog = new Animal({ type: 'dog' });

  dog.findSimilarTypes(function(err, dogs) {
    console.log(dogs); // woof
  });
```
注意：
* 不要覆盖mongoose的文档默认的方法
* 上面的例子使用了animalSchema.methods对象直接构建了文档实例的方法，你可可以使用Schema.method()方法来达到同样的效果
* 不要使用ES6的箭头函数来定义方法
### Statics
给model添加静态方法同样简单，例如下面方式
```
// assign a function to the "statics" object of our animalSchema
  animalSchema.statics.findByName = function(name, cb) {
    return this.find({ name: new RegExp(name, 'i') }, cb);
  };

  var Animal = mongoose.model('Animal', animalSchema);
  Animal.findByName('fido', function(err, animals) {
    console.log(animals);
  });
```
注意：不要使用箭头函数定义静态方法
### Query Helpers
我们也可以添加查询帮助方法，它和实例方法很像，但是只是mongoose中的查询方法，用来扩展mongoose的查询构建api。例如：
 ```
 animalSchema.query.byName = function(name) {
    return this.where({ name: new RegExp(name, 'i') });
  };

  var Animal = mongoose.model('Animal', animalSchema);

  Animal.find().byName('fido').exec(function(err, animals) {
    console.log(animals);
  });

  Animal.findOne().byName('fido').exec(function(err, animal) {
    console.log(animal);
  });
 ```
###  Indexs
Mongodb支持二级索引，在mongoose上面定义索引包括在两个级别，一个是path等级，一个是schema等级。当创建复合索引的时候定义schema等级的索引是必须的。
```
var animalSchema = new Schema({
    name: String,
    type: String,
    tags: { type: [String], index: true } // field level
  });

  animalSchema.index({ name: 1, type: -1 }); // schema level
```
在你的ap启动的时候，mongoose会自动调用createIndex来为schema中定义的索引创建索引，在开发环境下这个功能很赞，但是建议在正式环境下不要使用，因为这样会对MongoDB会有显著的性能影响。通过在你的schema中设置autoIndex为false来禁止这个行为，或者在全局链接的时候设置autoIndex为false。
```
mongoose.connect('mongodb://user:pass@localhost:port/database', { autoIndex: false });
  // or
  mongoose.createConnection('mongodb://user:pass@localhost:port/database', { autoIndex: false });
  // or
  animalSchema.set('autoIndex', false);
  // or
  new Schema({..}, { autoIndex: false });
```
mongoose会在model上触发一个index事件，在创建索引成功或者时候的时候。
```
// Will cause an error because mongodb has an _id index by default that
  // is not sparse
  animalSchema.index({ _id: 1 }, { sparse: true });
  var Animal = mongoose.model('Animal', animalSchema);

  Animal.on('index', function(error) {
    // "_id index cannot be sparse"
    console.log(error.message);
  });
```
也可以参看：[ensureIndexes](https://mongoosejs.com/docs/api.html#model_Model.ensureIndexes)方法
### Virtuals
Virtuals是文档的属性，你可以get或者set，但是他不持久化到MongoDB。get方法在格式化或者组合字段的时候非常有用。set方法在把一个值分解到多个值中进行存储也很有用。
```
// define a schema
  var personSchema = new Schema({
    name: {
      first: String,
      last: String
    }
  });

  // compile our model
  var Person = mongoose.model('Person', personSchema);

  // create a document
  var axl = new Person({
    name: { first: 'Axl', last: 'Rose' }
  });
```
猜想你会打印全部的用户名的全称。
```
console.log(axl.name.first + ' ' + axl.name.last); // Axl Rose
```
但是每次链接名字和姓氏都很麻烦。我们能不能在name的处理上做些其他的操作呢，一个virtual属性get方法可以满足你。

定义一个不会持久化到MongoDB的fullName属性：
```
personSchema.virtual('fullName').get(function () {
  return this.name.first + ' ' + this.name.last;
});
```
现在获取用户的全名可以通过上面定义的方法了
```
console.log(axl.fullName); // Axl Rose
```
如果你使用toJSON或者toObject方法mongoose默认是不会包含virtuals的。具体看文档。

你也可以添加setter方法到你的virtuals上。可以通过fullName方法同时设置first name and last name
```
personSchema.virtual('fullName').
  get(function() { return this.name.first + ' ' + this.name.last; }).
  set(function(v) {
    this.name.first = v.substr(0, v.indexOf(' '));
    this.name.last = v.substr(v.indexOf(' ') + 1);
  });

axl.fullName = 'William Rose'; // Now `axl.name.first` is "William"
```
Virtual属性setters在其他验证之前应用，所以及时把first and last属性设置为required。

只有非虚拟属性才能作为查询和字段选择的一部分,因为virtuals属性不存储在MongoDB中，所以不能够查询。
#### Aliases
具体看：官网：https://mongoosejs.com/docs/guide.html#indexes
### Options




