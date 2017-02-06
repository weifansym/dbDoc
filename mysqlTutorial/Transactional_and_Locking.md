## Transactional and Locking Statements
* 14.3.1 [START TRANSACTION, COMMIT, and ROLLBACK Syntax](https://dev.mysql.com/doc/refman/5.7/en/commit.html)
* 14.3.2 [Statements That Cannot Be Rolled Back](https://dev.mysql.com/doc/refman/5.7/en/cannot-roll-back.html)
* 14.3.3 [Statements That Cause an Implicit Commit](https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html)
* 14.3.4 [SAVEPOINT, ROLLBACK TO SAVEPOINT, and RELEASE SAVEPOINT Syntax](https://dev.mysql.com/doc/refman/5.7/en/savepoint.html)
* 14.3.5 [LOCK TABLES and UNLOCK TABLES Syntax](https://dev.mysql.com/doc/refman/5.7/en/lock-tables.html)
* 14.3.6 [SET TRANSACTION Syntax](https://dev.mysql.com/doc/refman/5.7/en/set-transaction.html)
* 14.3.7 [XA Transactions](https://dev.mysql.com/doc/refman/5.7/en/xa.html)

mysql通过下面的声明语句来在本地支持事务（在一个给定的客户端链接的session中）： SET autocommit, START TRANSACTION, COMMIT, and ROLLBACK（查看[SAVEPOINT, ROLLBACK TO SAVEPOINT, and RELEASE SAVEPOINT Syntax](https://dev.mysql.com/doc/refman/5.7/en/savepoint.html)）， **XA transaction**在mysql中支持分布式事务，参见：[XA Transactions](https://dev.mysql.com/doc/refman/5.7/en/xa.html)
