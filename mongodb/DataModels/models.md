## 关于数据模型
对于我们定于的数据模型，MongoDB不像关系型数据库一样有一个固定的数据schema,MongoDB的灵活性，让我们在定义数据模型的时候基本有两种方式：
* References：数据模型之间引用
* Embedded Data: 文档之间的嵌套。
其中引用方式被称为是Normalized Data Models(规范化数据模型)，内嵌文档模式被称为denormalized data models(非规范化的文档)
或者是Embedded Data Models(内嵌数据模型)

### 数据的原子写操作
在MongoDB中写操作在文档级别是原子操作。没有一个原子操作能够影响多于一个文档或者是集合。
对于内嵌的数据模型，由于我们插入和更新的都是同一个实体，所以是一个原子的写操作。
对于引用的数据模型操作，由于涉及到多个集合的操作，所以可能是非原子的操作。

### 数据的使用和性能
我们在定义一个数据模型的时候，要考虑到这个数据要怎么使用它，例如，如果你的程序只使用最近插入的数据，可以考虑使用Capped Collections，
或者如果你的程序需要大量的读操作，通过给查询字段添加索引。

### 数据模型的概念

#### 内嵌文档一对一关系模型
我们来看下面的一个例子，赞助人和赞助人地址，这个例子描述了内嵌文档比文档引用的优点，在查询上下文中获取整个相关数据的时候。在这个一对一的关系中，地址是属于赞助者的。

在标准形式的数据模型中，地址文档包含了对赞助者文档的引用
```
//  赞助者文档
{
   _id: "joe",
   name: "Joe Bookreader"
}

//  地址文档
{
   patron_id: "joe",
   street: "123 Fake Street",
   city: "Faketon",
   state: "MA",
   zip: "12345"
}
```
如果地址数据经常根据name字段进行查询，在引用的方式下你需要操作多个表进行多次查询才可以得到结果，最好的方式就是把address的信息内嵌到赞助者的文档中：
```
{
   _id: "joe",
   name: "Joe Bookreader",
   address: {
              street: "123 Fake Street",
              city: "Faketon",
              state: "MA",
              zip: "12345"
            }
}
```
在这种内嵌的情况下，只需要通过一次查询就可以获取到赞助商的整个信息。
#### 内嵌文档一对多关系模型
这里描述的文档模型主要是使用内嵌文档来描述文档之间的关系。
看下面的例子，一个赞助商对应多个地址，这个例子描述了使用内嵌文档比文档引用的好处，在查询上下文中获取整个相关数据的时候，在这个一对多的关系中，一个赞助商对应多个地址。

在标准形式的数据模型中，地址文档包含了对赞助者文档的引用
```
//  赞助者文档
{
   _id: "joe",
   name: "Joe Bookreader"
}

//  地址文档
{
   patron_id: "joe",
   street: "123 Fake Street",
   city: "Faketon",
   state: "MA",
   zip: "12345"
}

{
   patron_id: "joe",
   street: "1 Some Other Street",
   city: "Boston",
   state: "MA",
   zip: "12345"
}
```
如果地址数据经常根据name字段进行查询，在引用的方式下你需要操作多个表进行多次查询才可以得到结果，最好的方式就是把address的信息内嵌到赞助者的文档中：
```
{
   _id: "joe",
   name: "Joe Bookreader",
   addresses: [
                {
                  street: "123 Fake Street",
                  city: "Faketon",
                  state: "MA",
                  zip: "12345"
                },
                {
                  street: "1 Some Other Street",
                  city: "Boston",
                  state: "MA",
                  zip: "12345"
                }
              ]
 }
```
在这种内嵌的情况下，只需要通过一次查询就可以获取到赞助商的整个信息。
#### 文档引用中的一对多关系模型
这个文档使用引用来描述文档之间的关系，下面来看作者和书之间的关系，这个例子描述了在避免重复发布者信息中使用引用比使用内嵌的好处

在书籍文档中内嵌发布者文档，建会导致发布者信息重复
```
//  书籍文档
{
   title: "MongoDB: The Definitive Guide",
   author: [ "Kristina Chodorow", "Mike Dirolf" ],
   published_date: ISODate("2010-09-24"),
   pages: 216,
   language: "English",
   publisher: {
              name: "O'Reilly Media",
              founded: 1980,
              location: "CA"
            }
}

{
   title: "50 Tips and Tricks for MongoDB Developer",
   author: "Kristina Chodorow",
   published_date: ISODate("2011-05-06"),
   pages: 68,
   language: "English",
   publisher: {
              name: "O'Reilly Media",
              founded: 1980,
              location: "CA"
            }
}
```
为了避免重复就需要把发布者的信息和书的信息分离开，当使用引用的使用，增加的关系决定了怎么存储引用关系，如果每一个发布者的图书比较少有一定限制，在发布这文档中存储书籍的引用是一种比较好的方式，反之如果每一个发布者的图书数量是没有限制的，这个数据模型是易变的，像下面不断增长的数组，例子如下：
```
//  发布者文档
{
   name: "O'Reilly Media",
   founded: 1980,
   location: "CA",
   books: [123456789, 234567890, ...]
}

//  书籍文档
{
    _id: 123456789,
    title: "MongoDB: The Definitive Guide",
    author: [ "Kristina Chodorow", "Mike Dirolf" ],
    published_date: ISODate("2010-09-24"),
    pages: 216,
    language: "English"
}

{
   _id: 234567890,
   title: "50 Tips and Tricks for MongoDB Developer",
   author: "Kristina Chodorow",
   published_date: ISODate("2011-05-06"),
   pages: 68,
   language: "English"
}
```
为了避免增长的数组，在图书文档中存储发布者的引用
```
//  发布者信息
{
   _id: "oreilly",
   name: "O'Reilly Media",
   founded: 1980,
   location: "CA"
}

//  图书信息
{
   _id: 123456789,
   title: "MongoDB: The Definitive Guide",
   author: [ "Kristina Chodorow", "Mike Dirolf" ],
   published_date: ISODate("2010-09-24"),
   pages: 216,
   language: "English",
   publisher_id: "oreilly"
}

{
   _id: 234567890,
   title: "50 Tips and Tricks for MongoDB Developer",
   author: "Kristina Chodorow",
   published_date: ISODate("2011-05-06"),
   pages: 68,
   language: "English",
   publisher_id: "oreilly"
}
```
https://docs.mongodb.com/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/
