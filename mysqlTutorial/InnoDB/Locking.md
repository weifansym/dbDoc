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

由于InnoDB存储引擎支持的是行级别的锁，因此意向锁其实不会阻塞除全表扫描意外的人任何请求（例如：LOCK TABLES ... WRITE），意向锁的主要目的是显示某人正在锁定一行，或者将要锁定表中的一行。一个意向锁的事务的数据看起来和SHOW ENGINE INNODB STATUS 和 [InnoDB monitor](https://dev.mysql.com/doc/refman/5.7/en/innodb-standard-monitor.html) 输出的内容很像：
```
TABLE LOCK table `test`.`t` trx id 10080 lock mode IX
```
### Record Locks（记录锁）
记录锁是索引记录上的锁，例如：SELECT c1 FROM t WHERE c1 = 10 FOR UPDATE;防止任何其他的事务插入，更新，删除**t.c1**的为10的行。

记录锁一直锁定索引记录，即使表没有定义索引。 对于这种情况，InnoDB创建一个隐藏的聚集索引并使用这个索引进行记录锁定。参看章节：[Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/5.7/en/innodb-index-types.html).

一个记录锁的事务数据类型SHOW ENGINE INNODB STATUS 和 [InnoDB monitor](https://dev.mysql.com/doc/refman/5.7/en/innodb-standard-monitor.html)操作的输出：
```
RECORD LOCKS space id 58 page no 3 n bits 72 index `PRIMARY` of table `test`.`t` 
trx id 10078 lock_mode X locks rec but not gap
Record lock, heap no 2 PHYSICAL RECORD: n_fields 3; compact format; info bits 0
 0: len 4; hex 8000000a; asc     ;;
 1: len 6; hex 00000000274f; asc     'O;;
 2: len 7; hex b60000019d0110; asc        ;;
```
该锁是加在索引上的（从上面的index PRIMARY of table `test`.`t` 就能看出来）
记录锁可以有两种类型：lock_mode X locks rec but not gap  && lock_mode S locks rec but not gap

### Gap Locks(间隙锁)
间隙锁是一个在索引记录之间生成的锁，或者是在第一个索引之前的间隙或者最后一个索引之后间隙生成的锁。例如：SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE; 由于范围内所有现有值之间的间隔都被锁定，因此可以防止其他事务向列t.c1中插入值15，无论该列中是否已有任何这样的值。

间隔可能跨越单个索引值，多个索引值，甚至是空的。

间隙锁是性能和并发性之间折中的一部分，是在某些事务隔离级别中使用，而不是在其他级别中使用。

对于使用唯一索引锁定行以搜索唯一行的语句，不需要使用间隙锁定（这不包括搜索条件仅是由多列构成的唯一索引的一些列的情况; 在那种情况下，会发生间隙锁定。）
例如：如果id列具有唯一索引，则以下语句对id值为100的行仅使用索引记录锁，并且其他会话是否在上述间隔中插入行并不重要：
```
SELECT * FROM child WHERE id = 100;
```
如果id未被索引或者具有非唯一索引，则该语句将锁定上面说的间隙。

值得注意的是冲突锁可以在一个间隙中被不同的事务获得。例如：事务A在这个间隙中获得一个共享间隙锁（gap S-lock）同时事务B在这个间隙中获得了一个排他间隙锁（gap X-lock）。允许间隙锁的原因是如果一条记录从索引中删除，则具有这条记录的不同间隙锁的不同事物必须合并。

InnoDB存储引擎的间隙锁是“纯粹是抑制性的”，这意味着，他们只是阻止其他事务向这个间隙中插入数据，他们不阻止不同的事务在相同间隙获取间隙锁。因此，间隙X锁具有与间隙S锁相同的效果。

可以显示禁用间隙锁定，如果你设置事务隔离级别为READ COMMITTED或者设置innodb_locks_unsafe_for_binlog这个未被弃用的系统变量。在这些情况下，对搜索和索引扫描禁用间隙锁，仅用于外键约束检查和重复键检查。

把隔离级别设置为READ COMMITTED或者设置了innodb_locks_unsafe_for_binlog，还会带来其他的影响。在MySQL评估了WHERE条件后，释放不匹配行的记录锁。
对于UPDATE语句，InnoDB执行“半连续”读取，以便将最新的提交版本返回给MySQL，以便MySQL可以确定该行是否与UPDATE的WHERE条件匹配。

### Next-Key Locks
Next-Key锁是有在索引上的记录锁和在索引记录之前的间隙的间隙锁组成。

innodb以如下方式支持行级锁，当他搜索或扫描表索引时，它会在它遇到的索引记录上设置共享或排他锁。因此**行级锁其实就是索引记录锁**。一个在索引记录上的next-key锁，也影响索引记录前的间隙。也就是说next-key锁是在索引记录前的间隙由一个索引记录锁加间隙锁组成。如果一个会话在索引中具有记录R上的共享或排他锁，则另一个会话不能在索引顺序中的R之前的间隙中插入新的索引记录。

假设一个索引包含：10, 11, 13, 和20，对于这个索引可能next-key锁包含以下的间隔，其中圆括号表示排除间隔端点，而方括号表示包含端点：
```
(negative infinity, 10]
(10, 11]
(11, 13]
(13, 20]
(20, positive infinity)
```
对于最后一个间隔，next-key锁会锁定最大值以上的间隙并且“上游”伪记录有一个值，大于实际在索引中显示的任何值。这个上游值不是一个真实的索引记录，因此，实际上，next-key锁仅仅锁定最大索引值之后的间隙。

innoDB数据库引擎模式在 REPEATABLE READ事务隔离级别。在这个例子中innoDB使用next-key锁来搜索和索引扫描。这可以防止你“幻行”。

一个next-key锁的事务数据类型SHOW ENGINE INNODB STATUS 和 [InnoDB monitor](https://dev.mysql.com/doc/refman/5.7/en/innodb-standard-monitor.html)操作的输出：
```
RECORD LOCKS space id 58 page no 3 n bits 72 index `PRIMARY` of table `test`.`t` 
trx id 10080 lock_mode X
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0
 0: len 8; hex 73757072656d756d; asc supremum;;

Record lock, heap no 2 PHYSICAL RECORD: n_fields 3; compact format; info bits 0
 0: len 4; hex 8000000a; asc     ;;
 1: len 6; hex 00000000274f; asc     'O;;
 2: len 7; hex b60000019d0110; asc        ;;
```
### Insert Intention Locks

### AUTO-INC Locks

### Predicate Locks for Spatial Indexes

### 参见：
* http://www.ywnds.com/?p=4936
* http://mysql.taobao.org/monthly/2016/01/01/
* https://zhuanlan.zhihu.com/p/29150809
