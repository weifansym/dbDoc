## An InnoDB Deadlock Example
官方地址：[An InnoDB Deadlock Example](https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlock-example.html)

下面的例子描述了当一次的锁请求导致死锁是错误是怎么发生的。这个例子包含两个客户端A和B。
首先，客户端A创建了一个表，并插入了一条记录。然后开启一个事务。在这个事务中A通过查询数据在共享模式下获得了S锁。
```
mysql> CREATE TABLE t (i INT) ENGINE = InnoDB;
Query OK, 0 rows affected (1.07 sec)

mysql> INSERT INTO t (i) VALUES(1);
Query OK, 1 row affected (0.09 sec)

mysql> START TRANSACTION;
Query OK, 0 rows affected (0.00 sec)

mysql> SELECT * FROM t WHERE i = 1 LOCK IN SHARE MODE;
+------+
| i    |
+------+
|    1 |
+------+
```
接下来客户端B开启一个事物，删除这条记录。
```
mysql> START TRANSACTION;
Query OK, 0 rows affected (0.00 sec)

mysql> DELETE FROM t WHERE i = 1;
```
这个删除操作需要一个X锁，但是B无法获的该锁，因为它与客户端A持有的S锁不兼容（即两种锁互斥）。因此这个请求进入了此行的锁请求队列，客户端B被阻塞。

最后，客户端A也试图删除这条记录。
```
mysql> DELETE FROM t WHERE i = 1;
ERROR 1213 (40001): Deadlock found when trying to get lock;
try restarting transaction
```
死锁就这样发生了，因为客户端A需要一个X锁来删除此行记录。这个X锁是A是无法获得，因为B已经持有了这一行的X锁，并且在等待A释放他的S锁。结果，InnoDB在一个客户端上生成一个了错误，并释放这个客户端持有的锁。客户端返回如下错误：
```
ERROR 1213 (40001): Deadlock found when trying to get lock;
try restarting transaction
```
同时，另一个客户端获得了他想要的锁，并从表中删除了改行。
