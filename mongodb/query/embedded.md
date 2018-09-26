## 内嵌文档相关查询
### Query on Embedded/Nested Documents
我们以集合：inventory为例
```
db.inventory.insertMany( [
   { item: "journal", qty: 25, size: { h: 14, w: 21, uom: "cm" }, status: "A" },
   { item: "notebook", qty: 50, size: { h: 8.5, w: 11, uom: "in" }, status: "A" },
   { item: "paper", qty: 100, size: { h: 8.5, w: 11, uom: "in" }, status: "D" },
   { item: "planner", qty: 75, size: { h: 22.85, w: 30, uom: "cm" }, status: "D" },
   { item: "postcard", qty: 45, size: { h: 10, w: 15.25, uom: "cm" }, status: "A" }
]);
```
在匹配内嵌文档的时候，不仅要匹配文档中字段的值，同时内嵌文档的顺序也是需要的。例如下面两个是匹配不同的文档的
```
db.inventory.find( { size: { h: 14, w: 21, uom: "cm" } } )
```
```
db.inventory.find(  { size: { w: 21, h: 14, uom: "cm" } }  )
```
查询嵌套字段：使用点号在内嵌文档的字段上来指定一个查询条件，例如：field.nestedField，举例如下：
```
db.inventory.find( { "size.uom": "in" } )
```
查询size这个内嵌文档中，uom字段的值是in。

使用查询操作符：例如：
```
db.inventory.find( { "size.h": { $lt: 15 } } )
```
查询在内嵌文档size中，h字段的值小于15的文档。

指定多个条件的and查询：例如:
```
db.inventory.find( { "size.h": { $lt: 15 }, "size.uom": "in", status: "D" } )
```
查询size.h小于15,且size.uom的值是in,status的值是D的文档。

具体参看：https://docs.mongodb.com/manual/tutorial/query-embedded-documents/
