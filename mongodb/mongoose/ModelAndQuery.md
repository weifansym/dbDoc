### Model使用中要注意
在使用mongoose进行数据操作的时候，比如：Model.find()我们要注意的是，他们的返回值。
有时我们会有疑惑，比如：mongoose中的exec和then的疑惑？
```
model.find().then();
model.find().exec();
二者什么区别，好像都能用？
```
答案如下：
我们从官网中可以看出Model.find返回的是Query:
```
Model.find()
Parameters
conditions «Object»
[projection] «Object|String» optional fields to return, see Query.prototype.select()
[options] «Object» optional see Query.prototype.setOptions()
[callback] «Function»

Returns:
«Query»
Finds documents

The conditions are cast to their respective SchemaTypes before the command is sent.
```
而Query的返回值是Primise
```
Query.prototype.exec()
Parameters
[operation] «String|Function»
[callback] «Function» optional params depend on the function being called

Returns:
«Promise»
Executes the query
```
.then() 都是 promise 的链式调用。
```
model.find().then();
model.find().exec().then();
```
区别在于： mongoose的所有查询操作返回的结果都是 query （官方文档是这样写的），并非一个完整的promise。
而加上.exec()则将会返回成为一个完整的 promise 对象，但是其是 mongoose 自行封装的 promise ，与 ES6 标准的 promise 是有所出入的
（你应该会在控制台看到相关的警告），而且官方也明确指出，在未来的版本将会废除自行封装的promise，改为 ES6 标准，因此建议楼主在使用过程中替换为 
ES6 的 promise，如下：
```
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
```
针对上面的两个查询，其实两者返回的都是promise对象
exec一般用于独立的动作一次性执行，
then则用于连续性的动作，进行链式调用

从其方法名也可以区别它们的用法，exec就是执行的意思，
then就是然后怎么怎么，

exec和then的参数是有所不同的，前者是 callback(err,doc)，后者则是 resolved(doc),rejected(err)
