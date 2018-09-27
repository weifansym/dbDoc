### Mongoose查询返回的对象是不能直接修改的
```
//  以下代码不能直接运行，仅给出流程
const schema = new mongoose.Schema({
  title: String,
  date: Date,
  content: String
});

const Model = mongoose.model('test', schema);
const docs =  await Model.find({});

docs.forEach(function (doc) {
   doc.title = "测试";
});

// 执行完打印title，会发现修改不生效
console.log(docs);
```
### 修改的三种方法
```
// 不看文档直接撸
const docs =  await Model.find({});
const newDocs = docs.map(function (obj) {
  return Object.assign({}, obj);
});

// 调用toObject或toJSON方法
const docs = (await Model.find({})).toObject();

// 调用lean方法
const docs = await Model.find({}).lean();
```
toObject 与 toJSON 傻傻分不清楚
我也懒得解释了，直接看[stack overflow](https://stackoverflow.com/questions/31756673/what-is-the-difference-between-mongoose-toobject-and-tojson)。

### 有时候，你会需要transform
举个栗子：MongoDB 时间类型存储的是0时区时间，接口想要返回东8区时间；每次使用时都转换一遍太繁琐了，为什么不默认就返回东8区时间呢？

schema.options.toObject = schema.options.toJSON = {
  transform: function(doc, ret, options) {
    ret.date = ret.date.toEast8(); 
    return ret;
  }
}
用path也能实现相似功能

schema.path('date').get(function (date) {
  return date.toEast8();
});
schema.set('toObject', { getters: true });
schema.set('toJSON', { getters: true });
