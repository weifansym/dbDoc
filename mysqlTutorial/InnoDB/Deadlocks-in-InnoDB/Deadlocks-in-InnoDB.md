## Deadlocks in InnoDB
官方地址：[InnoDB中的死锁](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks.html)
死锁的情形是：事务不能继续执行的原因是多个事务在执行的时候拥有其他事务执行需要的锁，每一个事务都在等其他的事务释放锁资源，但是他们彼此都不释放自己拥有的锁，因此导致死锁发生。

当多个事务锁定多个表中的行时（通过语句,例如：UPDATE或SELECT ... FOR UPDATE）,但执行的顺序是相反的（即加锁的顺序相反）一个死锁就会发生。当一些语句锁定索引记录的范围和间隙时（即范围锁与间隙锁），也会发生死锁。因为每个事务都会由于时间问题而获取一些锁，而不是其他锁，对于一个死锁的例子[An InnoDB Deadlock Example
](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlock-example.html)。

为了减少可能出现的死锁，使用事务而不是锁表语句，同时在事务中插入，更新数据尽可能小，这样防止事务执行时间过长。当不同的事务更新多张表或更新很大范围的行时，在每个事务中需要使用相同的操作顺序（例如SELECT ... FOR UPDATE），当使用SELECT ... FOR UPDATE和UPDATE ... WHERE语句时需要在列上创建索引。死锁的可能性不受隔离级别的影响，因为隔离级别只是改变了读操作的行为，而死锁的发生是在写操作。关于避免死锁以及从死锁中恢复的更多信息请看：[How to Minimize and Handle Deadlocks](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks-handling.html).

默认死锁检测是开启的，此时死锁发生时，InnoDB检测到该情况并回滚其中一个事务。如果死锁检测不可能使用**innodb_deadlock_detect**配置选型设置。innodb依赖innodb_lock_wait_timeout设置在死锁情况下回滚事务，因此，即使你的逻辑是正确的，你也必须处理死锁，在这种情况下事务要进行重试。查看InnoDB中用户最近事务的死锁，使用**SHOW ENGINE INNODB STATUS**命令。如果频繁的死锁突出显示事务结构或应用程序错误处理的问题，设置innodb_print_all_deadlocks，运行打印所有在mysqld错误log中的死锁信息。关于死锁怎样自动监控与处理的更多信息参看：[Deadlock Detection and Rollback](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlock-detection.html)
