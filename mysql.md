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

### Pooling connections
直接使用

    var mysql = require('mysql');
    var pool  = mysql.createPool({
      connectionLimit : 10,
      host            : 'example.org',
      user            : 'bob',
      password        : 'secret',
      database        : 'my_db'
    });

    pool.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
      if (err) throw err;

      console.log('The solution is: ', rows[0].solution);
    });
连接池用来管理连接，当一个程序需要连接数据库会从连接池中去除连接，使用完之后放入连接池。实现连接共享

    var mysql = require('mysql');
    var pool  = mysql.createPool({
      host     : 'example.org',
      user     : 'bob',
      password : 'secret',
      database : 'my_db'
    });

    pool.getConnection(function(err, connection) {
      // connected! (unless `err` is set)
    });
当你使用完一个连接的时候，调用`connection.release()`将会释放连接，把链接归还给连接池。等待其他程序使用。

    var mysql = require('mysql');
    var pool  = mysql.createPool(...);

    pool.getConnection(function(err, connection) {
      // Use the connection
      connection.query( 'SELECT something FROM sometable', function(err, rows) {
        // And done with the connection.
        connection.release();

        // Don't use the connection here, it has been returned to the pool.
      });
    });
    
如果你想要关闭连接并把连接从连接池中删除的话，使用`connection.destroy()`语句。当有程序请求的时候连接池将会创建一个新的连接。连接在连接池中是一种**懒创建**,如果在你的连接池的配置中配置了100个连接，但是只是同时使用5个，那么将会有5个连接被创建。这些连接具有一种**round-robin**循环形式，连接会从连接池的顶部取，然后在底部返回给连接池。当上一个连接在连接池中恢复，一个**ping包**会发送给服务器，用来检测这个连接是否完好。

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
