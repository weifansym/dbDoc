## explain 再谈
[explain-output](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html)
### EXPLAIN EXTENDED
### EXPLAIN结果中哪些信息要引起关注
我们使用EXPLAIN解析SQL执行计划时，如果有下面几种情况，就需要特别关注下了：

首先看下 type 这列的结果，如果有类型是 ALL 时，表示预计会进行全表扫描（full table scan）。通常全表扫描的代价是比较大的，建议创建适当的索引，通过索引检索避免全表扫描。此外，全索引扫描（full index scan）的代价有时候是比全表扫描还要高的，除非是基于InnoDB表的主键索引扫描。

再来看下 Extra 列的结果，如果有出现 Using temporary 或者 Using filesort 则要多加关注：

Using temporary，表示需要创建临时表以满足需求，通常是因为GROUP BY的列没有索引，或者GROUP BY和ORDER BY的列不一样，也需要创建临时表，建议添加适当的索引。

Using filesort，表示无法利用索引完成排序，也有可能是因为多表连接时，排序字段不是驱动表中的字段，因此也没办法利用索引完成排序，建议添加适当的索引。

Using where，通常是因为全表扫描或全索引扫描时（type 列显示为 ALL 或 index），又加上了WHERE条件，建议添加适当的索引。

暂时想到上面几个，如果有遗漏，以后再补充。

其他状态例如：Using index、Using index condition、Using index for group-by 则都还好，不用紧张。

### 参考：
* [explain详解](https://www.cnblogs.com/duhuo/p/4605813.html)
* [EXPLAIN结果中哪些信息要引起关注](https://imysql.com/2015/06/14/mysql-faq-what-important-information-in-explain.shtml)
