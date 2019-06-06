## 数组查询
下面讲的是在数组字段上的查询。还是以inventory集合为例：
```
db.inventory.insertMany([
   { item: "journal", qty: 25, tags: ["blank", "red"], dim_cm: [ 14, 21 ] },
   { item: "notebook", qty: 50, tags: ["red", "blank"], dim_cm: [ 14, 21 ] },
   { item: "paper", qty: 100, tags: ["red", "blank", "plain"], dim_cm: [ 14, 21 ] },
   { item: "planner", qty: 75, tags: ["blank", "red"], dim_cm: [ 22.85, 30 ] },
   { item: "postcard", qty: 45, tags: ["blue"], dim_cm: [ 10, 15.25 ] }
]);
```
### 匹配一个数组
在一个数组上指定相等条件，这是一个精准数组匹配，不仅字段名要正确，数组的元素顺序也是必须得。举例如下：查询包含tags字段的文档，
切tags数组中元素顺序也是必须的。
```
db.inventory.find( { tags: ["red", "blank"] } )
```
假如我们不想考虑元素的顺序，或者其他元素，来匹配数组的话，可以使用下面的方法：
```
db.inventory.find( { tags: { $all: ["red", "blank"] } } )
```
### 通过单个元素查询数组
使用某个指定的值来查询数组，匹配的数组至少要包含一个词元素。例如：
```
db.inventory.find( { tags: "red" } )
```
上面的例子查询所有的文档包含数组tags，并且tags数组中包含元素red。

下面来看下在数组字段的元素上来指定查询字段：例如：
```
db.inventory.find( { dim_cm: { $gt: 25 } } )
```
上面是查询所有文档包含dim_cm字段且值大于25的文档。

### 对数组元素指定多个查询条件
当在数组元素上指定复合条件的时候，您可以指定查询，以便单个数组元素满足这些条件或数组元素的任何组合满足条件。
#### 在数据元素上通过复合过滤调价来查询数组
下面的例子查询文档,文档中包含dim_cm数组，且数组的元素在某种组合中满足查询条件。例如：一个元素满足大于15的条件，另外一个元素满足小于20的条件。
或者一个元素满足这两个条件。
```
db.inventory.find( { dim_cm: { $gt: 15, $lt: 20 } } )
```
#### 查询数组元素复合多种标准
使用 $elemMatch操作指定多种条件，在数组的元素上，返回只要有一个元素满足所有指定的标准。下面的例子查询文档中的dim_cm数组至少有一个元素同时满足大于22，
小于30这个条件。
```
db.inventory.find( { dim_cm: { $elemMatch: { $gt: 22, $lt: 30 } } } )
```
> 注意上面两种查询条件的区别
### 按照数组索引位置查询元素
使用点号访问，您可以为数组的特定索引或位置处的元素指定查询条件。 该数组使用从零开始的索引。下面看一个例子：下面的例子查询所有文档中数组dim_cm的
第二个元素大于25。
```
db.inventory.find( { "dim_cm.1": { $gt: 25 } } )
```
### 通过数组长度查询数组
使用$size操作符，查询匹配数组元素数量的文档。下面的例子查询tags中有三个元素的文档。
```
db.inventory.find( { "tags": { $size: 3 } } )
```
原文地址：[Query an Array](https://docs.mongodb.com/manual/tutorial/query-arrays/)

数组相关操作：https://docs.mongodb.com/manual/reference/operator/query-array/
