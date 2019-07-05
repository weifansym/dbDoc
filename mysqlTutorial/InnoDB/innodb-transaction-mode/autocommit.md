## autocommit, Commit, and Rollback(自动提交，提交与回滚)
官网地址：[自动提交,提交与回滚](https://dev.mysql.com/doc/refman/5.7/en/innodb-autocommit-commit-rollback.html)
在innodb中，所有用户的活动都是在事务中发生的。如果autocommit模式为true，每一个声明语句都会构建一个简单的事务。默认mysql为每个autocommit可用状态的
下的新连接开启一个会话，所以mysql在每个声明语句（这个声明语句不返回错误）后无需执行提交。如果声明语句返回一个错误，则commit or rollback的行为依赖于
这个错误，关于错误参看：[innodb-error](https://dev.mysql.com/doc/refman/5.7/en/innodb-error-handling.html)。

一个带有autocommit可用状态的会话，可以支持多个声明事务，这些事务开始通过明确的START TRANSACTION or BEGIN声明，并以COMMIT or ROLLBACK结尾。
[START TRANSACTION, COMMIT, and ROLLBACK Syntax](https://dev.mysql.com/doc/refman/5.7/en/commit.html)

通过设置SET autocommit = 0一个会话的autocommit状态不可用，会话将会一直有一个事务打开。可以使用一个COMMIT or ROLLBACK声明来结束当前事务，
或者从新开启一个新的事务。

如果一个会话处于autocommit不可用状态，并且没有明确的提交最后的事务。mysql将会ROLLBACK这个事务。

一些声明语句会隐式的结束事务，例如你在执行声明语句前执行了commit。[Statements That Cause an Implicit Commit](https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html)

一个commit意味着你在当前事务中所做的更改，将会持久化，并且其他会话也可看到。另一方面ROLLBACK语句取消当前事务的修改。COMMIT和ROLLBACK会释放当前事务
拥有的innodb锁。

### Grouping DML Operations with Transactions

默认情况下链接mysql是在autocommit可用模式下，即自动提交模式下。他会自动提交sql声明在你执行的时候。如果你有其他的数据库系统经验的话，这种操作模式可能
不太习惯。在标准实践中就是执行一系列的DML语句并一起commit或者roll back。

要使用多语句事务，请在SQL语句设置autocommit=0的情况下关闭autocommit，并根据需要使用commit或rollback结束每个事务，即在autocommit=0的状态下根据
具体情况使用commit和rollback结束事务。要使自动提交保持打开状态，请以start transaction开始每个事务，并以commit或rollback结束它。下面的例子提供了两个事务，第一个进行提交，第二个进行了回滚。

```
shell> mysql test

mysql> CREATE TABLE customer (a INT, b CHAR (20), INDEX (a));
Query OK, 0 rows affected (0.00 sec)
mysql> -- Do a transaction with autocommit turned on.
mysql> START TRANSACTION;
Query OK, 0 rows affected (0.00 sec)
mysql> INSERT INTO customer VALUES (10, 'Heikki');
Query OK, 1 row affected (0.00 sec)
mysql> COMMIT;
Query OK, 0 rows affected (0.00 sec)
mysql> -- Do another transaction with autocommit turned off.
mysql> SET autocommit=0;
Query OK, 0 rows affected (0.00 sec)
mysql> INSERT INTO customer VALUES (15, 'John');
Query OK, 1 row affected (0.00 sec)
mysql> INSERT INTO customer VALUES (20, 'Paul');
Query OK, 1 row affected (0.00 sec)
mysql> DELETE FROM customer WHERE b = 'Heikki';
Query OK, 1 row affected (0.00 sec)
mysql> -- Now we undo those last 2 inserts and the delete.
mysql> ROLLBACK;
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT * FROM customer;
+------+--------+
| a    | b      |
+------+--------+
|   10 | Heikki |
+------+--------+
1 row in set (0.00 sec)
mysql>
```
### Transactions in Client-Side Languages

例如PHP, Perl DBI, JDBC, ODBC以及标准C的api都是调用的mysql的接口。你可以发送事务控制语句例如COMMIT到mysql服务器，作为一个字符串他和其他的sql语句一样，例如SELECT和INSERT。其他的api也提供了特殊的事务提交与回滚的方法或函数等。
