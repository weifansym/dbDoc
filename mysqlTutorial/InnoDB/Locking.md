## InnoDB Locking
mysql官方地址：[InnoDB Locking](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html)

这一章节描述InnoDB存储引擎的锁类型
* Shared and Exclusive Locks
* Intention Locks
* Record Locks
* Next-Key Locks
* Insert Intention Locks
* AUTO-INC Locks
* Predicate Locks for Spatial Indexes

### Shared and Exclusive Locks
InnoDB扩展了标准的行级锁，标准的行级锁具有两种类型：shared (S) locks（共享锁）和exclusive (X) locks（排它锁）。
* shared (S) locks： 允许持有这种锁的事务读取一行数据
* exclusive (X) locks：允许持有这种锁的事务更新，删除一行数据
如果事务T1拥有一个共享锁在行r上，对于在行r上的其他事务T2的请求加锁，处理如下：
* 如果T2事务请求对行r加**S锁** 请求会立即生成，结果是T1事务与T2事务同时拥有行r的**S锁**。
* 如果T2事务请求对行r加**X锁**请求的锁是不会立即生效的。
如果事务T1在行r持有**X锁**,其他事务T2无论请求什么类型的锁都不会立即生效。事务T2会等待事务T1释放对行r的锁。

### Intention Locks
InnoDB supports multiple granularity locking which permits coexistence of row locks and table locks. For example,

### Record Locks

### Gap Locks

### Next-Key Locks

### Insert Intention Locks

### AUTO-INC Locks

### Predicate Locks for Spatial Indexes

