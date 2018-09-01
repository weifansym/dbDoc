## mongoose关于连接的知识点
官网地址：[connections](https://mongoosejs.com/docs/connections.html)

连接MongoDB使用**mongoose.connect()**方法。具体连接方法如下：
```
mongoose.connect('mongodb://username:password@host:port/database?options...');
```
### Operation Buffering
mongoose能够让你在不需要等待与MongoDB建立连接就可以操作Model，组要是在连接内部使用了buffers model方法。这样虽然方便但同时也导致，
在你使用一个没有连接的model的时候回导致程序默认不会抛出任何错误。所以关掉buffering操作，提供了两个级别，一个是schema级别一个是全局级别。

### Options
上面的链接方法中提供了一个options对象，他会发送给底层MongoDB驱动。
下面只讨论一些比较常见或者比较重要的选项。
* autoIndex：默认情况下mongoose会在链接的时候，自动为schema中定义的索引进行构建索引。在开发环境这个特性是很棒的，但是却不太适合在大型生成的部署，
因为索引的构建将会导致性能下降。如果设置**autoIndex**为false那个在本链接相关的任何Model上都不回自动构建索引的。
* autoReconnect：底层的数据库驱动将会在和MongoDB失去连接的时候尝试自动重连。除非你是想自己管理你的连接池的高级用户，否则不要把这个选项设置成false。
* reconnectTries：当你在连接一个相对简单的服务或者MongoDB代理的时候（不是副本集），MongoDB驱动将会试着重连reconnectTries次在
每隔**reconnectInterval**长时间，直到最后放弃连接。当驱动放弃连接的时候mongoose连接将会触发一个**reconnectFailed**事件。
这个选项对于副本集的链接不做任何处理。
* reconnectInterval：参见上面一条，表示重连的时间间隔。
* promiseLibrary：设置设置底层驱动的[promise library](http://mongodb.github.io/node-mongodb-native/2.1/api/MongoClient.html)
* poolSize: 本链接中MongoDB驱动能够保持链接的最大的sockets数量。默认poolSize的值是5。注意，截止到MongoDB 3.4版本，单个socket同时只允许一个操作。
因此，如果您发现有一些阻止更快查询继续执行的慢查询，您可能希望增加此值。
* bufferMaxEntries：MongoDB驱动也有自己的缓冲机制（buffering mechanism），在驱动程序断开链接时启动。如果你想要你的数据库操作立马失败，
而不是等待重连，当驱动不在链接状态的时候，在你的schema中设置这个选项值为0或者设置bufferCommands为false。
* connectTimeoutMS：在其内部尝试链接失败的前，MongoDB驱动将会等待多久。一单链接成功，此值就成了一个不相关的值了。
* socketTimeoutMS：在杀死一个非活动的socket之前MongoDB驱动要等待多久。由于无活动或者一个长运行的操作可能导致socket成为非活动状态。默认设置为30000。
如果您希望某些数据库操作运行时间超过20秒，侧应该把这个值设置成最长操作的2到3倍。
* family：链接使用IPv4 or IPv6进行连接。这个选项将会传递给Node.js的dns.lookup方法。如果没有指定这个参数，MongoDB的驱动将会首先尝试IPV6，
然后在尝试IPV4。如果你的**mongoose.connect(uri)**调用花费了很长时间，试着使用mongoose.connect(uri, { family: 4 })方法。
示例如下：
```
const options = {
  useNewUrlParser: true,
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};
mongoose.connect(uri, options);
```
