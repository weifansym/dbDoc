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

### Shared and Exclusive Locks(共享和排他锁)
InnoDB扩展了标准的行级锁，标准的行级锁具有两种类型：shared (S) locks（共享锁）和exclusive (X) locks（排它锁）。
* shared (S) locks： 允许持有这种锁的事务读取一行数据
* exclusive (X) locks：允许持有这种锁的事务更新，删除一行数据

如果事务T1拥有一个共享锁在行r上，对于在行r上的其他事务T2的请求加锁，处理如下：
* 如果T2事务请求对行r加**S锁** 请求会立即生成，结果是T1事务与T2事务同时拥有行r的**S锁**。
* 如果T2事务请求对行r加**X锁**请求的锁是不会立即生效的。
```
eg：select * from xx where a=1 lock in share mode
```
如果事务T1在行r持有**X锁**,其他事务T2无论请求什么类型的锁都不会立即生效。事务T2会等待事务T1释放对行r的锁。
```
eg: select * from xx where a=1 for update
````

### Intention Locks(意向锁)
InnoDB存储引擎在锁粒度上支持表锁（对整个表加上锁）和行锁（对某行记录加上锁）。例如，一个声明： LOCK TABLES ... WRITE，在指定的表上加排它锁（exclusive lock）。锁粒度与锁类型组合起来就有: 行级共享锁，表级共享锁，行级排他锁，表级排他锁。InnoDB存储引擎支持多粒度锁定，这种锁定允许在行级上的锁和表级上的锁同时存在。为了支持在不同锁粒度级别上进行加锁操作，InnoDB存储引擎支持一种额外的锁方式，我们称之为意向锁。意向锁是表级别的锁，其设计目的主要是为了在一个事务中揭示下一行将被请求的锁的类型。

InnoDB存储引擎支持两种意向锁：

意向共享锁（IS Lock）：事务想要获得一个表中某几行的共享锁。

意向排他锁（IX Lock）：事务想要获得一个表中某几行的排他锁。

例如： SELECT ... LOCK IN SHARE MODE是设置**IS**锁。 SELECT ... FOR UPDATE被设置为**IX**锁。

意向锁的规则如下：

(1)事务在对表T中的记录获取S锁前，先要获取表T的IS锁或者更强的锁；

(2)事务在获取表T中记录的X锁前，先要获取表T的IX锁；

表级锁类型兼容性如下：
![https://github.com/weifansym/dbDoc/blob/master/images/mysql/locking.png](https://github.com/weifansym/dbDoc/blob/master/images/mysql/locking.png)
如果请求锁的事务与现有的锁兼容，则授予锁，但如果它与现有的锁冲突，则该锁不会被授予。一个事物将会等待直到冲突的锁被释放。如果想要请求的锁与已经存在的锁
相冲突，并且因为会死锁而无法授予，将会导致错误发生。

意向锁是为了提高封锁子系统的效率。该封锁子系统支持多种封锁粒度。原因是:在多粒度封锁方法中一个数据对象可能以两种方式加锁―显式封锁和隐式封锁。

数据库引擎使用意向锁来保护锁层次结构的底层资源，以防止其他事务对自己锁住的资源造成伤害，提高锁冲突检测性能。例如，当读取表里的页面时，在请求页共享锁（S锁）之前，事务在表级请求共享意向锁。这样可以防止其他事务随后在表上获取排他锁（X锁），修改整个表格。意向锁可以提高性能，因为数据库引擎仅在表级检查意向锁，确定事务是否能安全地获取该表上的锁，而不需要检查表中的每行或每页上的锁以确定事务是否可以锁定整个表。

由于InnoDB存储引擎支持的是行级别的锁，因此意向锁其实不会阻塞除全表扫描意外的人任何请求（例如：LOCK TABLES ... WRITE），意向锁的主要目的是显示某人正在锁定一行，或者将要锁定表中的一行。一个意向锁的事务的数据看起来和SHOW ENGINE INNODB STATUS 和 InnoDB monitor 输出的内容很像：
```
TABLE LOCK table `test`.`t` trx id 10080 lock mode IX
```

### Record Locks

### Gap Locks

### Next-Key Locks

### Insert Intention Locks

### AUTO-INC Locks

### Predicate Locks for Spatial Indexes

