## SchemaTypes
SchemaTypes包含多种类型，这里只讨论几种比较特殊的，一个SchemaTypes相关的选项。具体还是要参考官网：
### SchemaType Options
给一个schema中的字段的定义类型有两种方式：
* 直接通过类型来定义
* 把字段声明为一个对象，其中type作为属性
```
var schema1 = new Schema({
  test: String // `test` is a path of type String
});

var schema2 = new Schema({
  test: { type: String } // `test` is a path of type string
});
```
除了type属性外，你也可以为一个path(schema中的字段)定义其他的属性，例如你想要一个字符串在存储前转化为小写字符：
```
var schema2 = new Schema({
  test: {
    type: String,
    lowercase: true // Always convert `test` to lowercase
  }
});
```
lowercase只能作用在字符串类型上，其中有一些选项可以作用在所有schema type上，一些只针对特定类型。

下面先来看下针对所有的schema type中的选项：
* required：布尔类型或者方法，如果是true对字段添加必要性效验
* default：任意值或者方法，为字段（path）设置默认值，如果是方法，测试方法的返回值。
* select：布尔类型，指定默认的查询映射
* validate：方法，对这个属性字段添加效验方法
* get: 方法，使用Object.defineProperty()为这个属性字段定义一个惯用的getter方法
* set: 方法，使用Object.defineProperty()为这个属性字段定义一个惯用的setter方法
* alias: 字符串，只能用在mongoose版本>= 4.10.0。定义一个虚拟的名字，来获取和设置这个字段
```
var numberSchema = new Schema({
  integerOnly: {
    type: Number,
    get: v => Math.round(v),
    set: v => Math.round(v),
    alias: 'i'
  }
});

var Number = mongoose.model('Number', numberSchema);

var doc = new Number();
doc.integerOnly = 2.001;
doc.integerOnly; // 2
doc.i; // 2
doc.i = 3.001;
doc.integerOnly; // 3
doc.i; // 3
```
#### Indexes
通过schema的type也可以定义mongodb的索引。
* index：布尔值，是否在字段上面定义索引
* unique：布尔值，在字段上定义唯一索引
* sparse：布尔值，在字段上定义稀疏索引
```
var schema2 = new Schema({
  test: {
    type: String,
    index: true,
    unique: true // Unique index. If you specify `unique: true`
    // specifying `index: true` is optional if you do `unique: true`
  }
});
```
#### String
* lowercase:
* uppercase:
* trim:
* match:
* enum:
* minlength:
* maxlength:
#### Number
* min:
* max:
#### Date
* min:
* max:
### Usage notes
#### Dates
#### Mixed
#### ObjectIds
指定一个类型为ObjectId，在你的声明中使用Schema.Types.ObjectId。
```
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Car = new Schema({ driver: ObjectId });
// or just Schema.ObjectId for backwards compatibility with v2
```
#### Boolean
#### Arrays
#### Maps

### Getters

