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
