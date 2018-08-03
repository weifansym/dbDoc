## redis分布式锁

在许多环境中，分布式锁是一种非常有用的原语，不同进程必须以互斥的方式对共享资源进行操作。
有许多库和博客文章描述了如何使用Redis实现DLM（分布式锁管理器），但是每个库都使用不同的方法，有些库使用了一些简单的方法，和稍微复杂一些的设计实现相比，
这些简单的设计可靠性不高。

### 简单的实现方式
命令如下：
```
SET resource-name anystring NX EX max-lock-time 
```
这是一种在 Redis 中实现锁的简单方法。
客户端执行上面的命令：
* 如果服务器返回 OK ，那么这个客户端获得锁。
* 如果服务器返回 NIL ，那么客户端获取锁失败，可以在稍后再重试。
设置的过期时间到达之后，锁将自动释放。可以通过以下修改，让这个锁实现更健壮：
* 不使用固定的字符串作为键的值，而是设置一个不可猜测（non-guessable）的长随机字符串，作为口令串（token）。
* 不使用 DEL 命令来释放锁，而是发送一个 Lua 脚本，这个脚本只在客户端传入的值和键的口令串相匹配时，才对键进行删除。
这两个改动可以防止持有过期锁的客户端误删现有锁的情况出现。

以下是一个简单的解锁脚本示例：
```
if redis.call("get",KEYS[1]) == ARGV[1]
then
    return redis.call("del",KEYS[1])
else
    return 0
end
```
这个脚本可以通过 EVAL ...script... 1 resource-name token-value 命令来调用。
### 推荐的方式
通过阅读[Distributed locks with Redis](https://redis.io/topics/distlock#distributed-locks-with-redis)，你会在其中找到基于**Redlock**算法的分布式锁。

里面包含了，不同语言实现的相关包。比如Node.js常用包：[node-redlock](https://github.com/mike-marcacci/node-redlock)

参考：
* [Distributed locks with Redis](https://redis.io/topics/distlock#distributed-locks-with-redis)
* http://redisdoc.com/string/set.html
* http://zhangtielei.com/posts/blog-redlock-reasoning.html
