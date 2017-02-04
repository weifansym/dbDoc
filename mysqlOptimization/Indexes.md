## Optimization and Indexes
* 9.3.1 [How MySQL Uses Indexes](https://dev.mysql.com/doc/refman/5.7/en/mysql-indexes.html)
* 9.3.2 [Using Primary Keys](https://dev.mysql.com/doc/refman/5.7/en/optimizing-primary-keys.html)
* 9.3.3 [Using Foreign Keys](https://dev.mysql.com/doc/refman/5.7/en/optimizing-foreign-keys.html)
* 9.3.4 [Column Indexes](https://dev.mysql.com/doc/refman/5.7/en/column-indexes.html)
* 9.3.5 [Multiple-Column Indexes](https://dev.mysql.com/doc/refman/5.7/en/multiple-column-indexes.html)
* 9.3.6 [Verifying Index Usage](https://dev.mysql.com/doc/refman/5.7/en/verifying-index-usage.html)
* 9.3.7 [InnoDB and MyISAM Index Statistics Collection](https://dev.mysql.com/doc/refman/5.7/en/index-statistics.html)
* 9.3.8 [Comparison of B-Tree and Hash Indexes](https://dev.mysql.com/doc/refman/5.7/en/index-btree-hash.html)
* 9.3.9 [Optimizer Use of Generated Column Indexes](https://dev.mysql.com/doc/refman/5.7/en/generated-column-index-optimizations.html)

提高查询性能最好的方式就是创建索引了，我们可以在一个或者是多个列上来创建索引。索引就像一个表的行的指针，允许查询很快决定那个列是符合where条件的，
然后检索出符合条件的所有行的其他列的值。所有的mysql的数据类型都可以做索引。

尽管我们可以在查询中对每个可能的列做索引，但是一些不必要的索引浪费空间，而且在mysql决定使用哪个索引的时候还浪费时间。另外索引也会增减插入，更新，删除等
操作的开销，因为再做这个操作的时候涉及到的索引也是需要更新的。所以你需要在平衡更快查询的情况适当的使用索引。
