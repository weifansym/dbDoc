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

**options**是一个包含以下属性的对象：

* **host**：Redis服务器的IP地址。默认值为：127.0.0.1
* **port**： Redis服务器的端口。默认值为：6379
* **path**： Redis服务器的UNIX套接字路径。默认为：null
* **url** ：Redis服务器的URL。格式为redis:]//[[user][:password@]]host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]。默认为：null
* **parser**： 使用内置的JS解析或使用hiredis解析，在< 2.6的版本中hiredis会默认被安装。默认为：null
* **string_numbers**：设置为true时会返回Redis数字字符串代替JavaScript数字字符串。默认为：null  
* **return_buffers**：设置为true时会向回调函数返回Buffer而不是字符串。默认为：false
* **detect_buffers**： 设置为true时会向回调函数返回Buffer而不是字符串，不同于return_buffers，这个参数会针对每一个命令的基础上进行Buffer和字符串之间进行转换。默认为：false
* **socket_keepalive**： 设置为true时，会保持socket套接字的连接。默认为：true
* **no_ready_check** ：当建立到Redis 服务器的连接时，仍可以从磁盘加载数据，加载时服务器不会响应任何命令。为了解决这个问题，node_redis会向服务器发送一个INFO命令以检查服务器的状态。默认为：false
* **enable_offline_queue**：默认情况下，当Redis 服务器没有活跃的连接时，这个命令会被添加到队列且会立即执行；当此选项设置为false时，会禁用此功能。默认为：true
* **retry_max_delay**： 默认情况下，客户端会在上次失败后延时一倍时间再次尝试重连，此选项用于设置尝试重连的时候。默认为：null
* **max_attempts**： 此选项用于设置客户端连接和重新连接的时间。默认为：3600000
* **connect_timeout**： 不再使用，请用retry_strategy选项替代
* **retry_unfulfilled_commands**：设置为true时，所有未实现的命令会重新连接后重试。默认为：true
* **password**：用于Redis 服务器验证的密码，别名auth_pass。在< 2.5的版本中必须使用auth_pass。默认为：null
* **db**： 设置后会在连接时执行select命令连接到指定数据库。默认为：null
* **family**：连接Redis服务器使用的IP协议族，参见Node.js的net模块和nds模块相关介绍。默认为：IPv4
* **disable_resubscribing**：设置为true时，客户端断开连接后不会重新订阅。默认为：false
* **rename_commands**：传入一个对象，对Redis 命令进行重命名。默认为：null
* **tls**：设置连接到Redis 服务器的TLS连接。默认为：null
* **prefix**：设置键的前缀。默认为：null
* **retry_strategy**：一个包含attempt选项的函数，total_retry_time选项会标识重试的次数。默认为：function

        var redis = require("redis");
        var client = redis.createClient({detect_buffers: true});

        client.set("foo_rand000000000000", "OK");

        // 这会返回一个JavaScript 字符串
        client.get("foo_rand000000000000", function (err, reply) {
          console.log(reply.toString()); // Will print `OK`
        });

        // 这会返回一个Buffer，因为原始key被指定为Buffer
        client.get(new Buffer("foo_rand000000000000"), function (err, reply) {
          console.log(reply.toString()); // Will print ``
        });
        client.quit();
retry_strategy选项的使用：

        var client = redis.createClient({
          retry_strategy: function (options) {
            if (options.error.code === 'ECONNREFUSED') {
              // 在一个指定错误或一个冲掉所有命令的错误后结束重连
              return new Error('The server refused the connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              // 在一个指定超时或一个冲掉所有命令的错误后结束重连
              return new Error('Retry time exhausted');
            }
            if (options.times_connected > 10) {
              // 在一个内置错误后结束重连
              return undefined;
            }
            // 指定时间后重连
            return Math.max(options.attempt * 100, 3000);
          }
        });
### redis.auth() - 验证
    client.auth(password[, callback])
当连接到一个需要验证的Redis 服务器时，AUTH命令必须在连接后首先发送。auth()方法会在每次连接后，和重新连接时发送验证密码。callback仅会在调用一次，会在第一次发送AUTH命令后被调用。
### backpressure - 背压
**stream**

在client.stream中客户端通过流（stream）的形式暴露，或者在client.should_buffer中客户会有一个命令缓冲区。可以结合缓冲区命令及流事件监听实现背压。
### redis.quit() - 退出
发送QUIT命令，并在命令处理结束后断开连接。如果这时进行重连，则会在结束后重新连接。这时所有的脱机命令会被一个错误冲刷。
### redis.end() - 强制断开
    client.end(flush)
强制断开Redis服务器的连接。注意，这个方法不会等待所有的回复被解析，如果你想优雅的退出，就应该使用上面的redis.quit()方法。

flush命令用于设置其它命令的处理方式。如果不关心其它命令，应该设置为true；如果希望其它命令静默失败，应该设置为false。

如，以下示例中会在响应被读取完成前断开Redis 服务器：
    
    const redis = require("redis");
    const client = redis.createClient();

    client.set("foo_rand000000000000", "some fantastic value", function (err, reply) {
      // 这会发生一个错误(flush 为 true时)或静默失败且回调函数不会被调用(flush 设置为 false时)
      console.log(err);
    });
    client.end(true);
    client.get("foo_rand000000000000", function (err, reply) {
      console.log(err); // => 'The connection has already been closed.'
    });
在生产环境中，一般不应将redis.end()方法的flush设置为true。
###  错误处理 (>= v.2.6)
所有Redis错误会返回ReplyError，所有未处理的命令都会返回一个包含拒绝原因的AbortError错误，当有多个命令被拒绝时会返回一个AbortError的子类错误对象AggregateError。

示例如下：

    const redis = require('./');
    const assert = require('assert');
    const client = redis.createClient();

    client.on('error', function (err) {
      assert(err instanceof Error);
      assert(err instanceof redis.AbortError);
      assert(err instanceof redis.AggregateError);
      assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
      assert.strictEqual(err.code, 'NR_CLOSED');
    });
    client.set('foo', 123, 'bar', function (err, res) { // 多个参数
      assert(err instanceof redis.ReplyError); // => true
      assert.strictEqual(err.command, 'SET');
      assert.deepStrictEqual(err.args, ['foo', 123, 'bar']);

      redis.debug_mode = true;
      client.set('foo', 'bar');
      client.get('foo');
      process.nextTick(function () {
        client.end(true); // Force closing the connection while the command did not yet return
        redis.debug_mode = false;
      });
    });
所有的ReplyError中都会包含执行的commod(命令)名和命令参数。

### client.unref()
调用底层使用Socket连接的Redis服务器的unref()方法，这会程序退出而不再挂起

注意，这是一个实验特性，只是一个支付Redis 协议的子集。
    
    const redis = require("redis")
    const client = redis.createClient()

    /*
      调用 unref() 后会使程序在执行完命令后立即退出
      其它情况下，服务器会挂起已建立的客户端连接
    */
    client.unref()
    client.get("foo", function (err, value){
      if (err) throw(err)
      console.log(value)
    })
### 哈希友好命令
大部分Redis命令是一个单个字符串或字符串数组参数，响应也会做为一个单个字符串或字符串数组返回。当使用哈希值时，请使用以下几个命令：

**client.hgetall(hash, callback)**

从HGETALL命令中返回的响应信息，会被node_redis转换为一个JavaScript对象。如：

    client.hmset("hosts", "mjr", "1", "another", "23", "home", "1234");
    client.hgetall("hosts", function (err, obj) {
      console.dir(obj);
    });
输出如下：

    { mjr: '1', another: '23', home: '1234' }
**client.hmset(hash, obj[, callback])**

也可以通过一个哈希对象设置多个值：

    client.HMSET(key2, {
      "0123456789": "abcdefghij", // NOTE: key 和 value 会强制做为字符串
      "some manner of key": "a type of value"
    });

**client.hmset(hash, key1, val1, ... keyn, valn, [callback])**

多个哈希值也可以做为参数列表传入：

    client.HMSET(key1, "0123456789", "abcdefghij", "some manner of key", "a type of value");
###  发布/订阅相关API
以下示例演示了发布/订阅（publish/subscribe）相关API。在程序中打开两个客户端连接，并订阅其（subscribe）其中的一个频道，并通过另一个客户端向这个频道发布信息：

    var redis = require("redis");
    var sub = redis.createClient(), pub = redis.createClient();
    var msg_count = 0;

    sub.on("subscribe", function (channel, count) {
      pub.publish("a nice channel", "I am sending a message.");
      pub.publish("a nice channel", "I am sending a second message.");
      pub.publish("a nice channel", "I am sending my last message.");
    });

    sub.on("message", function (channel, message) {
      console.log("sub channel " + channel + ": " + message);
      msg_count += 1;
      if (msg_count === 3) {
        sub.unsubscribe();
        sub.quit();
        pub.quit();
      }
    });

    sub.subscribe("a nice channel");
如果客户端发送一个SUBSCRIBE或PSUBSCRIBE命令，连接会进入subscriber模式。这时，只有命令确认订阅设置有效或退出。当订阅设置为空时，会返回正常模式。当在subscriber模式的情况下，如果你想法使用常规的命令去操作redis，只需要使用一个新的客户端来打开另一个连接就好了。
### 订阅相关事件
当客户端是一个活跃的订阅者时，可能会收以下事件：

**message** (channel, message)

当收到所订阅频道的消息时，客户端会发送'message'事件。监听函数中会包含一个channel和message参数，分别表示频道名和收到消息。

**pmessage** (pattern, channel, message)

当收到通过模式匹配订阅的频道消息时，客户端会发送'pmessage'事件。监听函数中会包含三个参数，pattern表示使用PSUBSCRIBE的匹配模式，channel表示频道名，message表示消息

**message_buffer** (pattern, channel, message)

与'message'事件，但收到的消息是一个Buffer。如果监听'message_buffer'的同时监听了'message'事件，它总会收到一个字符串。

**pmessage_buffer** (pattern, channel, message)

与'pmessage'事件，但收到的消息是一个Buffer。如果监听'pmessage_buffer'的同时监听了'pmessage'事件，它总会收到一个字符串。

**subscribe** (channel, count)

客户端会发送subscribe响应命令SUBSCRIBE。回调函数中有两个参数，channel表示频道名，count表示订阅者总数。

**psubscribe** (pattern, count)

客户端会发送psubscribe响应命令PSUBSCRIBE。回调函数中有两个参数，pattern表示原始匹配模式，count表示订阅者总数。

**unsubscribe** (channel, count)

客户端会发送unsubscribe响应命令UNSUBSCRIBE。回调函数中有两个参数，channel表示取消订阅的频道名，count表示剩余订阅者总数。当count是0时，表示该订阅者已离开，将不会再收到用户事件。

**punsubscribe** (pattern, count)

客户端会发送punsubscribe响应命令PUNSUBSCRIBE。回调函数中有两个参数，pattern表示取消订阅的匹配模式，count表示剩余订阅者总数。当count是0时，表示该订阅者已离开，将不会再收到用户事件。

### client.multi() - 执行多条命令
    client.multi([commands])
MULTI是一个命令队列，直到由EXEC发出，发出的命令都会Redis原子执行。在这个接口中，node_redis会在调用client.multi()时返回一个Multi对象。如果其中的任何命令执行失败，会进行回滚。

    const redis  = require("./index");
    const client = redis.createClient();
    var set_size = 20;

    client.sadd("bigset", "a member");
    client.sadd("bigset", "another member");

    while (set_size > 0) {
      client.sadd("bigset", "member " + set_size);
      set_size -= 1;
    }

    // 多条执行链会在一个回调中
    client.multi()
      .scard("bigset")
      .smembers("bigset")
      .keys("*", function (err, replies) {
        // NOTE: 回调代码不是原子产生，只有 .exec 完成后产生
        client.mget(replies, redis.print);
      })
      .dbsize()
      .exec(function (err, replies) {
        console.log("MULTI got " + replies.length + " replies");
        replies.forEach(function (reply, index) {
          console.log("Reply " + index + ": " + reply.toString());
        });
      });
### Multi - 对象
client.multi()是一个构造函数，它会返回一个Multi对象。Multi对象与client对象共享所有命令方法。命令会在Multi对象中排队，直到被Multi.exec()方法执行。

**Multi.exec([callback])**

Multi.exec()方法用于执行在Multi对象中排队的命令。如果你代码中有名法错误，那么会抛出EXECABORT异常，且中止所有命令。错误中有一个.errors属性，其中包含了错误信息。如果所有命名都排队成功，而Redis处理命令时发生错误，那么错误会在结果数组中返回。

你可以将上面的多条命名链在一起执行，也可以像下面示例中做为队列单独执行并返回一个常规错误：

    var redis  = require("redis"),
      client = redis.createClient(), multi;

    // 开始一个单独的多命名队列
    multi = client.multi();
    multi.incr("incr thing", redis.print);
    multi.incr("incr other thing", redis.print);

    // 立即执行
    client.mset("incr thing", 100, "incr other thing", 1, redis.print);

    // 多命令排队并自动执行
    multi.exec(function (err, replies) {
     console.log(replies); // 101, 2
    });

除了向MULTI单独添加命令外，还可以将一个包含命令和参数的数组传递给构造函数：

    var redis  = require("redis"),
      client = redis.createClient(), multi;

    client.multi([
      ["mget", "multifoo", "multibar", redis.print],
      ["incr", "multifoo"],
      ["incr", "multibar"]
    ]).exec(function (err, replies) {
      console.log(replies);
    });
**Multi.exec_atomic([callback])**

与Multi.exec方法相同，但执行时不使用事务
### client.batch() - 批量执行命令
该方法与client.multi方法相同，但执行时不使用事务。这个方法更推荐在想执行多条命令，但不依赖事务的使用中。

BATCH是一个命令队列，直到由EXEC发出，发出的命令都会Redis原子执行。
### Monitor(监控)模式
Redis 支持MONITOR命令，这使你可以查看Redis服务器接收的所有客户端命令情况，包括其它客户端库和其它电脑。

每个命令都会发送一个monitor事件，因为每个命名都会连接的客户端发送到服务器，包括监控客户端本身。对monitor事件的回调函数中有三个参数，Redis服务器的收到命令的时间戳、命令参数数组、原监控字符串数组。
## 扩展
redis模块中还有一些其它的属性、方法等。
### client.server_info - 服务器信息
准备完成后，通过INFO命令返回的服务器信息会保存在client.server_info属性中，该属性是一个对象。

如，我们可通过该属性查询版本信息：

    > client.server_info.redis_version
    '2.3.0'
    > client.server_info.versions
    [ 2, 3, 0 ]

### redis.print() - 输出返回值
redis.print()是一个用显示测试返回值的回调。如：

    var redis = require("redis"),
      client = redis.createClient();

    client.on("connect", function () {
      client.set("foo_rand000000000000", "some fantastic value", redis.print);
      client.get("foo_rand000000000000", redis.print); 
    });

输出如下：

    Reply: OK
    Reply: some fantastic value
### 多单词命令
执行多单词的命令，如SCRIPT LOAD或CLIENT LIST，可以将第一个单词做为方法名，第二个单词做为参数传入即可：

    client.script('load', 'return 1');
    client.multi().script('load', 'return 1').exec(...);
    client.multi([['script', 'load', 'return 1']]).exec(...);

### client.duplicate() - 复制
    client.duplicate([options][, callback])
复制所有当前选项并返回一个新实例，所有传递给函数的选项都会覆盖原选项。如果传入一个回调，重制将等待客户端准备好并返回它。如果同时发生错误，那将返回错误而不是回调。
### client.send_command() - 发送命令
    client.send_command(command_name[, [args][, callback]])
所有的Redis命令都已被添加到client对象中。如果有在这个库更新前添加的新命令，可以通过send_command将其发送给Redis 服务器，发送的命令应该使用小写形式。


### client.connected - 连接状态
client.connected属性会返回一个布尔值，表示与Redis 服务器的连接状态。
### client.command_queue_length - 命令队列长度
该属性表示发送给Redis 服务器的命令队列长度
###  client.offline_queue_length - 连接前命令队列长度
该属性表示将在连线后，发送给Redis 服务器的命令队列长度
### 可选命令与关键字参数
这适用于任何一个[redis.io/commands](http://redis.io/commands)文档中的可选项，如：[WITHSCORES]或[LIMIT offset count]。

示例：

    var args = [ 'myzset', 1, 'one', 2, 'two', 3, 'three', 99, 'ninety-nine' ];
    client.zadd(args, function (err, response) {
      if (err) throw err;
      console.log('added '+response+' items.');

      // -Infinity and +Infinity also work
      var args1 = [ 'myzset', '+inf', '-inf' ];
      client.zrevrangebyscore(args1, function (err, response) {
        if (err) throw err;
        console.log('example1', response);
        // write your code here
      });

      var max = 3, min = 1, offset = 1, count = 2;
      var args2 = [ 'myzset', max, min, 'WITHSCORES', 'LIMIT', offset, count ];
      client.zrevrangebyscore(args2, function (err, response) {
        if (err) throw err;
        console.log('example2', response);
        // write your code here
      });
    });


