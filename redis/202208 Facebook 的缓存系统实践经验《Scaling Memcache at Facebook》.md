## 202208 Facebook 的缓存系统实践经验《Scaling Memcache at Facebook》
### 说明
2013年4月3日，Facebook 发布了一篇名为《Scaling Memcache at Facebook》的论文，介绍了 Facebook 的缓存系统设计经验，这里是对论文内容的提炼和总结。
### 场景与问题
#### 场景：
Facebook 的网页访问量巨大，分别来自于不同的地区，每个网页的响应需要读取数百条缓存数据，缓存数据以读取操作为主，QPS 十亿（billion）级别，key 的数量万亿（trillion）级别。

#### 问题：
1. 异地多中心架构中，缓存系统如何部署？
2. 业务系统使用缓存时，缓存的读/写/过期策略是什么？
3. 缓存数据与数据库数据的一致性是怎样的？
4. 怎样降低延迟和后端负载？
5. 怎样降低成本？
### 系统拓扑与交互过程
根据论文内容推导出的系统拓扑图：

![image](https://user-images.githubusercontent.com/6757408/234050476-df52008b-1410-4c97-8052-16902ec8ad2d.png)

1. 每个机房中部署一套独立的缓存系统，主要接收同机房内的读写请求，Client 聚合指令后路由到对应的 memcache
2. regional pool 由分布在多个机房中的 memcache 组成，用于承接较少访问、无需跨机房备份的数据
3. 所有机房中的数据库写操作转发到 MySQL 主库执行，从库从主库复制数据，主从库有各自的 commit log 监听服务，均向本地机房发送 key 失效的指令
4. 从 MySQL 的 commit log 中解析出的 key 失效指令，聚合后发送到 McRouters 再分发到对应的 memcache
5. memache 故障导致读写失败后，Client 将请求转发到 Gutter pool 重试
6. 新增加的 Cluster 的 Client：遇到 cache miss 之后，从其它 warm cluster 中读取数据，直到本机房的 cache hit rate 稳定后，改成从数据库读取 cache miss 的数据

### key 存放规划
应用程序设计时根据 key 的特点来决定将 key 放置到哪个 memcache pool、是否需要在每个 region 中存放一个缓存备份。不需要每个 region 备份的 key 放置到 regional pool。

Key 的特点列举：
1. 读取频次高还是低
2. 高流失率(high-churn)还是低流失率(high-churn)，即更新频次高还是低
3. cache miss 后重新加载的代价高还是低

### value 更新过程
1. 应用程序更新数据库记录之前，为需要更新 value 的 key 设置 marker
2. 应用程序更新数据库记录（写主库）
3. 应用程序发送 key 的失效指令，Client 将其路由到同机房的 memcache 或者 regional pool
4. 数据库主库的 commit log 监听组件分析出需要失效的 key，删除对应 marker 并将失效指令聚合后批量发送给 mcrouter 继而路由到同机房的 memcache
5. 数据库从库从主库收到同步操作，完成从库数据更新
6. 数据库从库的 commit log 监听组件分析出需要失效的 key，聚合后批量发送给 mcrouter 继而路由到同机房 memcache
7. memcache pool 中 memcache 进行数据同步

### cache 查询过程
1. 应用程序的 Get 请求，发送到部署在当前机器上 Client，Client 实现了 memcache 接口
2. Client 通过 DAG 对目标 key 进行依赖分析，将收到 Get 请求转换成多个可并行的批量请求
3. Client 通过 UDP 协议将批量的 Get 请求路由到目标 memcache，Client 知晓全局拓扑具有路由能力
4. Client 路由的目标 memcache 通常位于本机房，除非目标 key 位于跨机房分布的 regional pool
5. Client 通过类似 TCP 拥塞控制的滑动窗口控制请求的发送频率，避免大量数据同时返回导致拥塞
6. Client 收到目标 memcache 返回的数据，将 UDP 丢包乱序导致的数据错误当作 cache miss 处理
7. Client 可能收到稍后重试的回应，原因是目标 key 存在有效的 lease，表明对应的 value 正在更新过程中
8. Client 可能发现目标 memcache 失联，将请求转发给机器数量占比 1% 的 Gutter Region
9. Client 可能收到 cache miss 结果和绑定到 key 的 lease，进入 cache miss 处置流程

相关数据：
1. 每个批量请求中平均包含 24 个 key，95% 分位是 95 个 key
2. 使用 UDP 协议发送 Get 请求，高峰时结果丢弃率为 0.25%，其中 80% 因为丢包或延迟，20% 因为乱序
3. 使用 UDP 协议后，Get 请求延迟相比使用 TCP 协议降低了 20%

### cache miss 处置过程
Client 收到 cache miss 的处理过程：
1. Client 收到 cache miss 和绑定到对应 key 的 lease
2. 如果 Client 当前所在的 Region Cluster 是 Warm Cluster，向应用程序返回 cache miss，进入应用程序的 cache miss 处置过程
3. 如果 Client 当前所在的 Region Cluster 是新上线的 Cold Cluster，从 Warm Cluster 查询数据并将其 Add 到 Cold Cluster。
4. Client 向 Cold Cluster 发起的 Add 可能因为 2 秒钟的 hold-off 限制而失败，向应用程序返回 cache miss，进入应用程序的 cache miss 处置过程

> 2 秒钟的 hold-off：一个 key 被删除后的 2 秒内不能再次设置 value。避免将 Warm Cluster 中的旧数据添加到 Cold Cluster。

应用程序收到 cache miss 的处理过程：
1. 应用程序查询目标 key 在 regional pool 中是否存在 marker
2. 应用程序从主库（存在 marker）/从库（不存在 marker）读取数据，将数据连带 lease 组成 Set 指令执行发送到 Client 继而路由到目标 memcache
3. 目标 memcache 判断 lease 是否有效，如果 lease 已经因为删除操作而失效，放弃本次更新
4. memcache pool 中的 memcache 进行数据同步

> Marker 机制用于避免应用程序把从库中尚未更新的旧数据写入缓存。
### memcache 节点故障处置过程
1. Client 发现目标 memcache 失联
2. Client 将请求重新路由到同机房中的 Gutter Pool，执行 cache 查询以及 cache miss 处置
3. Client 发现 Gutter Pool 失联，终止

### region 上线过程
1. new region 中的 Client 初始配置成：1）遇到cache miss 从其它已经完成 warmup 的 Region 加载数据，见 cache miss 处置过程；2）2秒钟的 hold-off
2. new region 的 hit rate 稳定之后，Client 恢复为标准配置

### Facebook 的实践经验借鉴
Facebook 是高吞吐跨地域分布的巨型应用。

高吞吐：缓存服务如果因故障未能拦截住对后端持久性存储系统的访问，可能直接导致级联失败。

跨地域：需要尽可能减少跨 IDC 的网络通信。

### Application 缓存策略的选择
论文中没有明确说明应用程序使用的缓存策略，通过相关内容可以判断出：

**Facebook 采用的缓存读写策略是 Cache-Aside：**
> Cache-Aside：应用程序先从缓存中查询数据，如果不存在从数据库中查询，并将查询结果写入缓存。

Cache 中数据的 Add 路径有 2 个：
1. 已经完成 warmup 的 Warm Cluster，应用程序遇到 cache miss，应用程序查库后写入
2. 尚未完成 warmup 的 Cold Cluster，Client 遇到 cache miss，Client 从 warm cluster 中读取后写入

**通过增强的写入策略，解决了频繁更新、导致缓存持续失效、引发频繁读库的 thundering herds 问题：**

应用程序遇到 cache miss 向 cache 中新增加 Key 时，需要提供 cache miss 响应中附带的 lease。 Memcache 对于单个 key 每 10s 分发一个 lease，如果上一个 lease 还未失效，返回
稍后重试的回应。

Cache 中数据的清理路径有 5 个：
1. 内存空间不足，缓存数据被驱除
2. 缓存数据超时自动失效
3. 应用程序更新数据库前向所在机房的 memcache 发送失效指令（通过 Client 路由）
4. 监听数据库 主库 commit log，向主库所在机房中的 memcache 发送失效指令，McRouter 负责路由
5. 监听数据库 从库 commit log，向从库所在机房中的 memcache 发送失效指令，McRouter 负责路由

**仅通过失效的方式清理不一致的缓存数据，触发 cache miss 后，重新加载最新数据实现最终一致：**

这种做法增加了 cache miss，并且旧数据存在暴露窗口，但是极大降低了一致性的实现成本。 如果应用程序更新数据库后主动更新缓存，「缓存中更新顺序」和「数据库中更新顺序」可能不一致。

### Cache 一致性级别的选择
**Facebook 不保证从缓存中读取的数据和数据库中的记录始终一致，由应用程序在设计时考虑这种情况。**
Facebook 的实践里，memcache 中的缓存数据和数据库中的数据是最终一致，应用程序从缓存中读到的数据有可能是旧数据。 比如：应用程序将数据库中的数据更新后，在清理之前的时间窗口中，缓存中
存放的是和最新数据不一致的旧数据。

特别是数据库主库更新引发不一致时，从库所在机房中的清理操作有更大的延迟：数据库主从同步延迟+从库 commit log 解析延迟+指令送达延迟。

**Facebook 设计了 marker 机制降低从缓存中读到旧数据的可能（非杜绝）：**
1. 应用程序在更新会影响缓存中数据的数据库记录之前，为对应的 key 在 regional pool 中设置一个 marker，意味着 key 的 value 正在更新中
2. 另一个请求遇到 cache miss 后，如果对应 key 存在 marker，应用程序从数据库主库中加载数据，避开了主从同步期间的不一致窗口
3. marker 在主库的 commit log 触发的旧数据清除过程中被清除，保证了 marker 被清除时主库中一定已经是更新后的数据

**使用 memcache hold-off 功能，在 Cold Cluster 的 Warmup 阶段避免写入旧数据**

Cold Cluster 设置了 2 秒钟的 hold-off：一个 key 被删除后的 2 秒内不能再次设置 value。避免将 Warm Cluster 中的旧数据添加到 Cold Cluster。
### 降低响应延迟的方法
1. Client 汇聚请求，并通过 DAG 分析转换成可并行的批量请求。
2. Client 实现拥塞控制，避免了数据报文拥塞导致的无效传输。
3. Get 请求通过 UDP 协议发送，降低连接建立延迟和开销。
4. 同 Region 的 memcache pool 中的多个 memcache 数据同步，共同分担读取请求。
5. 每个 Region 中的 memcache 存储相同的 key，读取请求不需要跨机房（Regional Pool 除外）。
6. 划分多个 memcache pool，将不同特点的 key 分开存放，实现整体最优
7. 将 memcache 改造成多线程，每个线程分配一个 UDP 端口
8. 改造 memcache 的内存分配算法，实现具有自适应能力的 Slab Allocator
9. 改造 memcache 的驱除机制，将 short-lived 的 key 放入单独的环形列表，更及时地进行过期清理

### 降低后端负载的方法
1. 通过 lease 机制，解决 thundering herd 问题，避免缓存频繁失效，请求穿透到数据库
2. 设计了缓存数据为空的 Cold Cluster 的 warmup 过程，减少了对数据库的访问

### 避免级联失败的方法
1. 设置了占机器总数 1% 的 Gutter Pool，专职负责承接发送到故障节点的请求，锁定了最大失败区域。
### 降低资源成本的方法
1. 设计了跨机房分布的 regional pool，不需要多机房备份的 key 放入 regional pool，减少 replica 开销
2. 机房间只有数据库主从复制一条数据同步通道

### 一种缓存使用策略
1. 应用程序设计成能够处理从缓存中获取到旧数据的情况，譬如在落库或其它时机校验发现数据不一致
2. 只对缓存进行 Add 和 Delete 操作，不执行 Update
3. 如果有条件且有需求，监听数据库 commit log，补偿 Delete 操作
4. 如果有条件且有需求，更新数据库之前为 key 设置 Marker，更新数据后清除

### 扩展
Memcached 和 Redis 的异同： [Comparing Redis and Memcached](https://aws.amazon.com/cn/elasticache/redis-vs-memcached/)
### 参考
1. [李佶澳的博客](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2022/08/31/facebook-scaling-memcache.html)
2. [《Scaling Memcache at Facebook》](https://research.facebook.com/publications/scaling-memcache-at-facebook/)
3. [Comparing Redis and Memcached](https://aws.amazon.com/cn/elasticache/redis-vs-memcached/)
4. 



















