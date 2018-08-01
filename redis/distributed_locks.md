## redis分布式锁
本文翻译自：[Distributed locks with Redis](https://redis.io/topics/distlock#distributed-locks-with-redis)

在许多环境中，分布式锁是一种非常有用的原语，不同进程必须以互斥的方式对共享资源进行操作。
有许多库和博客文章描述了如何使用Redis实现DLM（分布式锁管理器），但是每个库都使用不同的方法，有些库使用了一些简单的方法，和稍微复杂一些的设计实现相比，
这些简单的设计可靠性不高。

