### Install
    $ npm install mysql
### Introduction
这是一个node.js的mysql驱动，使用JavaScript编写，不需要编译，完全开源，下面先放一个实例吧
    
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'me',
      password : 'secret',
      database : 'my_db'
    });

    connection.connect();

    connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
      if (err) throw err;

      console.log('The solution is: ', rows[0].solution);
    });

    connection.end();
从上面这个例子你可以了解到：
* 在一个连接中的每个被调用的方法需要顺序执行（把所有的执行放在一个队列里，然后执行）
* 调用`end()`用来关闭连接，在发送**quit packet**到服务器之前请确保所有的query都已经运行。
### Transactions(事务)
在连接等级支持简单的事务：


    connection.beginTransaction(function(err) {
      if (err) { throw err; }
      connection.query('INSERT INTO posts SET title=?', title, function(err, result) {
        if (err) {
          return connection.rollback(function() {
            throw err;
          });
        }

        var log = 'Post ' + result.insertId + ' added';

        connection.query('INSERT INTO log SET data=?', log, function(err, result) {
          if (err) {
            return connection.rollback(function() {
              throw err;
            });
          }  
          connection.commit(function(err) {
            if (err) {
              return connection.rollback(function() {
                throw err;
              });
            }
            console.log('success!');
          });
        });
      });
    });
> 注意**beginTransaction(), commit() and rollback()方法**只是简单的便利方法，这些便利方内部运行着**START TRANSACTION, COMMIT, and ROLLBACK**等 **MYSQL**命令。理解：许多mysql命令在mysql中都是隐式提交的这是很重要的，查看[MySQL documentation](http://dev.mysql.com/doc/refman/5.5/en/implicit-commit.html).
