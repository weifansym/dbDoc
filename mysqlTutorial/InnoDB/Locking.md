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

### Shared_and_Exclusive_Locks
InnoDB implements standard row-level locking where there are two types of locks,

### Intention_Locks
InnoDB supports multiple granularity locking which permits coexistence of row locks and table locks. For example,

### Record_Locks

### Gap_Locks

### Next-Key_Locks

### Insert_Intention_Locks

### AUTO-INC_Locks

### Predicate_Locks_for_Spatial_Indexes

