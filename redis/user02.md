## Redis实现唯一计数的3种方法分享 
唯一计数是网站系统中十分常见的一个功能特性，例如网站需要统计每天访问的人数 unique visitor （也就是 UV）。计数问题很常见，但解决起来可能十分复杂：
一是需要计数的量可能很大，比如大型的站点每天有数百万的人访问，数据量相当大；二是通常还希望扩展计数的维度，比如除了需要每天的 UV，还想知道每周或每月的
UV，这样导致计算十分复杂。在关系数据库存储的系统里，实现唯一计数的方法就是 select count(distinct <item_id>)，它十分简单，但是如果数据量很大，这个语句执行是很慢的。
用关系数据库另外一个问题是插入数据性能也不高。
Redis 解决这类计数问题得心应手，相比关系数据库速度更快，消耗资源更少，甚至提供了 3 种不同的方法。
### 基于 set
Redis 的 set 用于保存唯一的数据集合，通过它可以快速判断某一个元素是否存在于集合中，也可以快速计算某一个集合的元素个数，另外和可以合并集合到一个新的集合
中。涉及的命令如下：
```
SISMEMBER key member  # 判断 member 是否存在
SADD key member  # 往集合中加入 member
SCARD key   # 获取集合元素个数 
```
基于 set 的方法简单有效，计数精确，适用面广，易于理解，它的缺点是消耗资源比较大（当然比起关系数据库是少很多的），如果元素个数很大（比如上亿的计数），
消耗内存很恐怖。
### 基于 bit
Redis 的 bit 可以用于实现比 set 内存高度压缩的计数，它通过一个 bit 1 或 0 来存储某个元素是否存在信息。例如网站唯一访客计数，可以把 user_id 作为
bit 的偏移量 offset，设置为 1 表示有访问，使用 1 MB的空间就可以存放 800 多万用户的一天访问计数情况。涉及的命令如下：
```
SETBIT key offset value  # 设置位信息
GETBIT key offset        # 获取位信息
BITCOUNT key [start end] # 计数
BITOP operation destkey key [key ...]  # 位图合并 
```
基于 bit 的方法比起 set 空间消耗小得多，但是它要求元素能否简单映射为位偏移，适用面窄了不少，另外它消耗的空间取决于最大偏移量，和计数值无关，
如果最大偏移量很大，消耗内存也相当可观。
### 基于 HyperLogLog
实现超大数据量精确的唯一计数都是比较困难的，但是如果只是近似的话，计算科学里有很多高效的算法，其中 HyperLogLog Counting 就是其中非常著名的算法，
它可以仅仅使用 12 k左右的内存，实现上亿的唯一计数，而且误差控制在百分之一左右。涉及的命令如下：
```
PFADD key element [element ...]  # 加入元素
PFCOUNT key [key ...]   # 计数
```
这种计数方法真的很神奇，我也没有彻底弄明白，有兴趣可以深入研究相关文章。
redis 提供的这三种唯一计数方式各有优劣，可以充分满足不同情况下的计数要求。