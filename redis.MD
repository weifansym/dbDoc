## Node.js Redis客户端模块
redis（node_redis）模块中文文档：Redis 常用于跨进程、跨服务器的数据缓存服务，如：使用Redis存储Session会话数据等。
Node.js 中了连接Redis要使用redis（node_redis）模块，该模块是一个完整的、功能丰富的Node.js Redis 客户端，它支持所有Redis命令且注重于高性能特征。

### 模块安装
使用前首先要通过npm命令安装模块：

    npm install redis
### 使用示例
安装模块后，就可以像下面这样创建Redis 客户端，并写入数据：

    const redis = require("redis");
    const client = redis.createClient();
    // 不使用默认连接方式时，使用如下方式创建客户端：
    // const client = redis.createClient({host:'localhost', port:6379, password:'myPassword'});

    // 如果想要选择第3个而不是第0个(默认)的数据库，调用方式如下：
    // client.select(3, function() { /* ... */ });

    client.on("error", function (err) {
      console.log("Error " + err);
    });

    client.set("string key", "string val", redis.print);
    client.hset("hash key", "hashtest 1", "some value", redis.print);
    client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    client.hkeys("hash key", function (err, replies) {
      console.log(replies.length + " replies:");
      replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
      });
      client.quit();
    });

保存以上代码，并使用node命令执行，显示如下：

    Reply: OK
    Reply: 1
    Reply: 1
    2 replies:
        0: hashtest 1
        1: hashtest 2

在上面的示例中使用了异步API，所在需要通过回调函数获取服务器的返回数据。

自v.2.6版本起，API同时支持“驼峰式”和“蛇形”命名规则，可以在模块的选项、变量、事件等中使用任意两种命名方式，但更推荐使用“驼峰式”命名规则。

### Promise支持
可以通过**bluebird**模块实现**node_redis**对**Promise**的支持：

    var redis = require('redis');
    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);
    
这会给所有node_redis函数添加Async支持(如：return client.getAsync().then())：
    
    // 对于一个 'foo': 'bar' 值，要以通过以下方式代替 client.get('foo', cb);:
    return client.getAsync('foo').then(function(res) {
        console.log(res); // => 'bar'
    });

    // 使用多个 promise 时可以像这样：
    return client.multi().get('foo').execAsync().then(function(res) {
        console.log(res); // => 'bar'
    });
### 发送命令
每个Redis 命令都会通过client对象中的一个函数暴露，所有这些函数都会有一个args数组选项和一个callback回调函数。示例如下：

    client.hmset(["key", "test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});
    // 同样可以你下面这样
    client.hmset("key", ["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});
    // 或
    client.hmset("key", "test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});
    
如果未传入key时，会返回null：

    client.get("missingkey", function(err, reply) {
      // 当未传入key时会返回null
      console.log(reply);
    });
  
Redis中的命名请查看：[Redis Command Reference](http://redis.io/commands)

## redis模块的API
### 连接与事件
client对象在连接到Redis服务器时会发送一些事件：

* **ready**：client会在建立连接时发送'ready'事件
* **connect**：client会在流连接到服务器时发送connect事件
* **reconnecting**：client会在丢失连接后尝试重新连接时发送'reconnecting'事件。监听函数的参数中会包含一个delay和一个attempt属性
* **error**：client会在连接的服务器发生错误时发送'error'事件
* **end**：client会在断开与Redis服务器的连接时发送'end'事件
* **warning**：client会在客户端发送密码但Redis服务器并不需要密码时发送'warning'事件

### redis.createClient() - 创建客户端连接
如果在同一如机器运行了Redis服务器，且不需要密码，那可以通过createClient创建一个RedisClient对象，而不使用任何参数。其它情况下可通过以下方式创建客户端：

    redis.createClient([options])
    redis.createClient(unix_socket[, options])
    redis.createClient(redis_url[, options])
    redis.createClient(port[, host][, options])
    
> http://itbilu.com/nodejs/npm/EkiI9PG4-.html
