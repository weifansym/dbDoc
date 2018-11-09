## Redis的使用模式之计数器模式实例 
Redis 是目前 NoSQL 领域的当红炸子鸡，它象一把瑞士军刀，小巧、锋利、实用，特别适合解决一些使用传统关系数据库难以解决的问题。打算写一系列 Redis 使用模式的文章，深入总结介绍 Redis 常见的使用模式，以供大家参考。
### 常见汇总计数器
汇总计数是系统常见功能，比如网站通常需要统计注册用户数，网站总浏览次数等等。 使用 Redis 提供的基本数据类型就能实现汇总计数器，通过 incr 命令实现增加操作。
比如注册用户数，基本操作命令如下：
```
# 获取注册用户数
  get total_users
  # 注册用户数增加一位
  incr total_users
```
### 按时间汇总的计数器
通常计数还要按时间统计，比如注册用户数需要按日统计，处理方法比较简单，把日期带入计数器 key 就可以。
还是注册用户计数的例子，基本操作命令如下：
```
# 假定操作 2014-07-06 数据
  # 获取注册用户数
  get total_users:2014-07-06
  # 2014-07-06 注册用户数增加一位
  incr total_users:2014-07-06
  # 设置 48 小时过期时间 172800 = 48 * 60 * 60
  expire total_users:2014-07-06 172800
```
为计数器设置一个 48 小时的过期时间是为了节省计数器占用空间，毕竟 redis 是内存数据库，可以在过期前执行一个任务把计数器存入关系数据库。
## 速度控制
速度控制也是 Redis 一种常见的计数用途，比如有一个 API 服务，希望控制每一个 IP 每秒请求数不超过 10 次，可以用 IP 和 时间秒作为 key 设置一个计数器，
实现控制，伪代码如下所示：
```
# 每秒最大请求数
  MAX_REQUESTS_PER_SECOND = 10
 
  # 检查 ip 请求限制
  # @param ip
  # @raise 超过限制，抛出 RuntimeError 异常
  def check_request_limitation_for_ip(ip)
    time_tick = Time.now.to_i
    key = "#{ip}:#{time_tick}"
    num = $redis.get(key).to_i
    if num > MAX_REQUEST_PER_SECOND
      raise 'too many requests'
    else
      $redis.incr(key)
      $redis.expire(key, 10)
    end
  end
```
### 使用 Hash 数据类型维护大量计数器
有时候需要维护大量计数器，比如每一个论坛主题的查看数，比如每一个用户访问页面次数，因为论坛主题和用户基数可能很大，直接基于论坛主题或用户 ID 生成计数器的话，占用 Redis 资源还是相当可观的，这时可以用 Hash 数据类型压缩所需资源。
比如，对应论坛主题查看计数，可以由模式
```
key: topic:<topic_id>:views
  value: view count (integer)
```
转换为模式：
```
key: topic:views
  value: hash
    hash key: <topic_id>
    hash value: view count (integer)
```
总结：利用 Redis 实现计数器，可以简单高效实现各种计数功能。


