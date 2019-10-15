## InnoDB Error Handling
[InnoDB Error Handling](https://dev.mysql.com/doc/refman/5.7/en/innodb-error-handling.html)

下面的内容描述了InnoDB引擎进行错误处理。InnoDB有时仅仅回滚失败的语句，有时会回滚整个事务。

* 如果表空间中的文件空间用完，就会出现mysql table is full错误，innodb会回滚sql语句。
* 一个事务死锁会导致InnoDB引擎回滚整个事务，
* 如果没有指定IGNORE选项在语句中，一个重复键错误会回滚要执行的语句。
* 一个row too long 错误回滚当前语句。
* 其他错误主要由mysql代码层检测（高于InnoDB存储引擎级别），它们回滚相应的sql语句。在单个SQL语句的回滚中不会释放锁

在隐式回滚的时候，以及在执行显式 ROLLBACK SQL语句的时候，show processlist在相关连接的state列中显示Rolling back
