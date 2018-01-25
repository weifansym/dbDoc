## 查询相关内容

### Comparison Query Operators
相关操作如下：
```
$eq:  与指定值的相等
$gt:  比指定的值大
$gte:  比指定的值大或者和指定的值相等
$in: 匹配指定数组中的任意值
$lt: 小于指定值
$lte:  小于等于指定值
$ne: 与指定值不相等
$nin:  不在指定的数组内的值
```
### Logical Query Operators
官网地址
[Logical Query Operators](https://docs.mongodb.com/manual/reference/operator/query-logical/)

相关逻辑如下：
```
$and: 	Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
$not:  Inverts the effect of a query expression and returns documents that do not match the query expression.
$nor:  Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
$or:  Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
```


### Element Query Operators
官网地址：[Element Query Operators](https://docs.mongodb.com/manual/reference/operator/query-element/)

```
$exists: Matches documents that have the specified field.
$type: Selects documents if a field is of the specified type.
```
### Evaluation Query Operators
官网地址：[Evaluation Query Operators](https://docs.mongodb.com/manual/reference/operator/query-evaluation/)

包含操作：
```
$expr:  Allows use of aggregation expressions within the query language.
$jsonSchema: Validate documents against the given JSON Schema.
$mod:  Performs a modulo operation on the value of a field and selects documents with a specified result.
$regex:  Selects documents where values match a specified regular expression.
$text: Performs text search.
$where:  Matches documents that satisfy a JavaScript expression.
```
### Geospatial Query Operators
官网地址：[Geospatial Query Operators](https://docs.mongodb.com/manual/reference/operator/query-geospatial/)

包含操作：

Query Selectors:
```
$geoIntersects:  
$geoWithin:  
$near:  
$nearSphere:  
```

Geometry Specifiers:
```
$box:  
$center:  
$centerSphere:
$geometry:
$maxDistance:
$minDistance:
$polygon:
$uniqueDocs:
```
### Array Query Operators
官网地址：[Array Query Operators](https://docs.mongodb.com/manual/reference/operator/query-array/)

包含操作：
```
$all:
$elemMatch:
$size:
```
### Bitwise Query Operators
官网地址：
[Bitwise Query Operators](https://docs.mongodb.com/manual/reference/operator/query-bitwise/)

包含操作：
```
$bitsAllClear: 
$bitsAllSet:
$bitsAnyClear:
$bitsAnySet:
```
### $comment
### projection

包含操作:
```
$: 
$elemMatch 
$meta:
$slice:
```
## Query Modifiers
官网地址: [Query Modifiers](https://docs.mongodb.com/manual/reference/operator/query-modifier/)
