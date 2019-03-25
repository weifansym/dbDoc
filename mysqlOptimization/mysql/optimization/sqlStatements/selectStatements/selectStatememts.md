## Optimizing SELECT Statements
[Optimizing SELECT Statements](https://dev.mysql.com/doc/refman/5.7/en/select-optimization.html)
### 优化查询主要的条件如下：
* 提高**SELECT ... WHERE**的查询速度，首先需要检查是否添加了索引。在WHERE字句的条件中给相应的列添加索引，这样加速评估，过滤，返回最终结果。
为避免浪费磁盘空间，请构建一小组索引，以加速在应用程序中使用的许多相关查询。

索引对于引用不同表的查询尤其重要，例如使用联接和外键等功能。你可以使用[EXPLAIN](https://dev.mysql.com/doc/refman/5.7/en/explain.html)来决定是那些索引在查询中被使用。

* 隔离并调整查询的任何部分，例如那些占用很多时间的函数调用。根据查询的结构，可以为结果集中的每一行调用一次函数，甚至可以为表中的每一行调用一次函数，
从而大大减轻任何低效率。

* 最大限度地减少查询中的全表扫描数，尤其是对于大表
* 通过定期使用[ANALYZE TABLE](https://dev.mysql.com/doc/refman/5.7/en/analyze-table.html)语句使表统计信息保持最新，因此优化程序具有构建高效执行计划所需的信息
* 学习调整技巧，索引技术，参数配置等在为每一个表指定存储引擎。InnoDB 和 MyISAM都有许多查询高性能的指导。
* 您可以优化InnoDB表的单查询事务，使用[Optimizing InnoDB Read-Only Transactions](https://dev.mysql.com/doc/refman/5.7/en/innodb-performance-ro-txn.html)技术
* 调整内存域的大小以及配置在mysql使用缓存的时候，有效的方法：InnoDB buffer pool，MyISAM 的key缓存，以及mysql查询缓存。重复查询运行得更快，
因为第二次及以后的时间都会从内存中检索结果。使用缓存能够提高查询，你仍然需要优化你的查询使他们使用更少的内存，使你的应用程序更健壮。
* 处理锁的问题：其中查询速度可能会受到同时访问表的其他会话的影响
