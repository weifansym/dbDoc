## 跨库分页
[业界难题-“跨库分页”的四种方案](https://mp.weixin.qq.com/s/h99sXP4mvVFsJw6Oh3aU5A?)
### 一、需求缘起

分页需求

互联网很多业务都有分页拉取数据的需求，例如：

（1）微信消息过多时，拉取第N页消息

（2）京东下单过多时，拉取第N页订单

（3）浏览58同城，查看第N页帖子

 
这些业务场景对应的消息表，订单表，帖子表分页拉取需求有这样一些特点：

（1）有一个业务主键id, 例如msg_id, order_id, tiezi_id

（2）分页排序是按照非业务主键id来排序的，业务中经常按照时间time来排序order by

 
在数据量不大时，可以通过在排序字段time上建立索引，利用SQL提供的offset/limit功能就能满足分页查询需求：
```
select * from t_msg order by time offset 200 limit 100

select * from t_order order by time offset 200 limit 100

select * from t_tiezi order by time offset 200 limit 100
```
此处假设一页数据为100条，均拉取第3页数据。

 

分库需求

高并发大流量的互联网架构，一般通过服务层来访问数据库，随着数据量的增大，数据库需要进行水平切分，分库后将数据分布到不同的数据库实例（甚至物理机器）上，以达到降低数据量，增加实例数的扩容目的。

一旦涉及分库，逃不开“分库依据”patition key的概念，使用哪一个字段来水平切分数据库呢：大部分的业务场景，会使用业务主键id。
 
确定了分库依据patition key后，接下来要确定的是分库算法：大部分的业务场景，会使用业务主键id取模的算法来分库，这样即能够保证每个库的数据分布是均匀的，又能够保证每个库的请求分布是均匀的，实在是简单实现负载均衡的好方法，此法在互联网架构中应用颇多。
 
举一个更具体的例子：

![图一](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2U4IolFbkkfgKQiaYwsCpu3V8yOmxo6AlTmKicic72XJ1fKib9icqhoSNnAWA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

用户库user，水平切分后变为两个库，分库依据patition key是uid，分库算法是uid取模：uid%2余0的数据会落到db0，uid%2余1的数据会落到db1。

问题的提出

仍然是上述用户库的例子，如果业务要查询“最近注册的第3页用户”，该如何实现呢？单库上，可以
```
select * from t_user order by time offset 200 limit 100
```
变成两个库后，分库依据是uid，排序依据是time，数据库层失去了time排序的全局视野，数据分布在两个库上，此时该怎么办呢？

如何满足“跨越多个水平切分数据库，且分库依据与排序依据为不同属性，并需要进行分页”的查询需求，实现 select * from T order by time offset X limit Y的跨库分页SQL，是本文将要讨论的技术问题。

二、全局视野法

![图2](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UtmSPhU1vHzMyHffTs1nHZYbKpq0zmY40ibtHNM6JDuf3nKFoBz2iaM0w/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

如上图所述，服务层通过uid取模将数据分布到两个库上去之后，每个数据库都失去了全局视野，数据按照time局部排序之后，不管哪个分库的第3页数据，都不一定是全局排序的第3页数据。

那到底哪些数据才是全局排序的第3页数据呢，暂且分三种情况讨论。

（1）极端情况，两个库的数据完全一样

![图3](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2U5g2JODcz2QaCPBg9M4rgARxNQwUdmqvnRQ3MBeoZaAiaYeIQwJOa3Yw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

如果两个库的数据完全相同，只需要每个库offset一半，再取半页，就是最终想要的数据（如上图中粉色部分数据）。

（2）极端情况，结果数据来自一个库

![图4](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2Ua6x05ib1HAr604O2tbvGaicxrJJTuoO36mJFcAUcXxwuhsfIIvKwhQicw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

（3）一般情况，每个库数据各包含一部分

![图5](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UQNiaRByKV8822JEIHqHVHGBwTNHO2lIXQ6SP0cu6lpFfKgu5OEjVhsA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

正常情况下，全局排序的第3页数据，每个库都会包含一部分（如上图中粉色部分数据）。

由于不清楚到底是哪种情况，所以必须每个库都返回3页数据，所得到的6页数据在服务层进行内存排序，得到数据全局视野，再取第3页数据，便能够得到想要的全局分页数据。

再总结一下这个方案的步骤：

（1）将order by time offset X limit Y，改写成order by time offset 0 limit X+Y

（2）服务层将改写后的SQL语句发往各个分库：即例子中的各取3页数据

（3）假设共分为N个库，服务层将得到N*(X+Y)条数据：即例子中的6页数据

（4）服务层对得到的N*(X+Y)条数据进行内存排序，内存排序后再取偏移量X后的Y条记录，就是全局视野所需的一页数据

方案优点：通过服务层修改SQL语句，扩大数据召回量，能够得到全局视野，业务无损，精准返回所需数据。

方案缺点（显而易见）：

（1）每个分库需要返回更多的数据，增大了网络传输量（耗网络）；

（2）除了数据库按照time进行排序，服务层还需要进行二次排序，增大了服务层的计算量（耗CPU）；

（3）最致命的，这个算法随着页码的增大，性能会急剧下降，这是因为SQL改写后每个分库要返回X+Y行数据：返回第3页，offset中的X=200；假如要返回第100页，offset中的X=9900，即每个分库要返回100页数据，数据量和排序量都将大增，性能平方级下降。

三、业务折衷法

“全局视野法”虽然性能较差，但其业务无损，数据精准，不失为一种方案，有没有性能更优的方案呢？

“任何脱离业务的架构设计都是耍流氓”，技术方案需要折衷，在技术难度较大的情况下，业务需求的折衷能够极大的简化技术方案。

业务折衷一：禁止跳页查询

在数据量很大，翻页数很多的时候，很多产品并不提供“直接跳到指定页面”的功能，而只提供“下一页”的功能，这一个小小的业务折衷，就能极大的降低技术方案的复杂度。

![图6](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2U6oibIVAT35jp8rZRwWPhNovwL0Df0iccR3aFMnuc6OV8e8zic3ZDpeuDg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

如上图，不够跳页，那么第一次只能够查第一页：
（1）将查询order by time offset 0 limit 100，改写成order by time where time>0 limit 100

（2）上述改写和offset 0 limit 100的效果相同，都是每个分库返回了一页数据（上图中粉色部分）；

![图7](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UnG2BkdeGcm1oJegibrOfj41u1iajBK8lcONlNjcLLML3WFct3jWl3fOQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

（3）服务层得到2页数据，内存排序，取出前100条数据，作为最终的第一页数据，这个全局的第一页数据，一般来说每个分库都包含一部分数据（如上图粉色部分）；

咦，这个方案也需要服务器内存排序，岂不是和“全局视野法”一样么？第一页数据的拉取确实一样，但每一次“下一页”拉取的方案就不一样了。

点击“下一页”时，需要拉取第二页数据，在第一页数据的基础之上，能够找到第一页数据time的最大值：

![图8](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UrteM2edJ9XPkCAibDSlsvpPUqNBibGibbCRkl8sHk1ObaFAUdWogTBqpQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

这个上一页记录的time_max，会作为第二页数据拉取的查询条件：

（1）将查询order by time offset 100 limit 100，改写成order by time where time>$time_max limit 100

![图9](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2Uoa6iaxibmcRdXwWOMpZjkA5iaiaiaKhReeUjHl59tGzvtpyu1FzAjs06j5w/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

（2）这下不是返回2页数据了（“全局视野法，会改写成offset 0 limit 200”），每个分库还是返回一页数据（如上图中粉色部分）；

![图10](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2U9IE81DZLvxFgsfQiaVp1JWjU7NZMsicgbeebBicjiaB4N41Kp1baD4S3ew/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

（3）服务层得到2页数据，内存排序，取出前100条数据，作为最终的第2页数据，这个全局的第2页数据，一般来说也是每个分库都包含一部分数据（如上图粉色部分）；

如此往复，查询全局视野第100页数据时，不是将查询条件改写为offset 0 limit 9900+100（返回100页数据），而是改写为time>$time_max99 limit 100（仍返回一页数据），以保证数据的传输量和排序的数据量不会随着不断翻页而导致性能下降。

业务折衷二：允许数据精度损失

“全局视野法”能够返回业务无损的精确数据，在查询页数较大，例如第100页时，会有性能问题，此时业务上是否能够接受，返回的100页不是精准的数据，而允许有一些数据偏差呢？

数据库分库-数据均衡原理

使用patition key进行分库，在数据量较大，数据分布足够随机的情况下，各分库所有非patition key属性，在各个分库上的数据分布，统计概率情况是一致的。

例如，在uid随机的情况下，使用uid取模分两库，db0和db1：

（1）性别属性，如果db0库上的男性用户占比70%，则db1上男性用户占比也应为70%

（2）年龄属性，如果db0库上18-28岁少女用户比例占比15%，则db1上少女用户比例也应为15%

（3）时间属性，如果db0库上每天10:00之前登录的用户占比为20%，则db1上应该是相同的统计规律
…

![图11](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UE4lmYibhYNX4LekaMmLpwziacIv2AfiaMA24obSXKHgjGvavn86UNnDrw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

利用这一原理，要查询全局100页数据，offset 9900 limit 100改写为offset 4950 limit 50，每个分库偏移4950（一半），获取50条数据（半页），得到的数据集的并集，基本能够认为，是全局数据的offset 9900 limit 100的数据，当然，这一页数据的精度，并不是精准的。

根据实际业务经验，用户都要查询第100页网页、帖子、邮件的数据了，这一页数据的精准性损失，业务上往往是可以接受的，但此时技术方案的复杂度便大大降低了，既不需要返回更多的数据，也不需要进行服务内存排序了。

四、终极武器-二次查询法

有没有一种技术方案，即能够满足业务的精确需要，无需业务折衷，又高性能的方法呢？这就是接下来要介绍的终极武器：“二次查询法”。

为了方便举例，假设一页只有5条数据，查询第200页的SQL语句为select * from T order by time offset 1000 limit 5;

步骤一：查询改写

将select * from T order by time offset 1000 limit 5

改写为select * from T order by time offset 500 limit 5

并投递给所有的分库，注意，这个offset的500，来自于全局offset的总偏移量1000，除以水平切分数据库个数2。

如果是3个分库，则可以改写为select * from T order by time offset 333 limit 5

假设这三个分库返回的数据(time, uid)如下：

![图12](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2Uo3wYSCIk9kNAwNoFJ7mEBJH9ZGLESg1Iaia8oxpXbE51YTFibAnP1vgQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

可以看到，每个分库都是返回的按照time排序的一页数据。

步骤二：找到所返回3页全部数据的最小值

第一个库，5条数据的time最小值是1487501123

第二个库，5条数据的time最小值是1487501133

第三个库，5条数据的time最小值是1487501143
![图13](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2U3bNFiacSP3zAibI4x8eqAbLPF4lNjnnG2QiaI4JfIlvNzIbbzJbbSFw9g/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)
故，三页数据中，time最小值来自第一个库，time_min=1487501123，这个过程只需要比较各个分库第一条数据，时间复杂度很低

步骤三：查询二次改写

第一次改写的SQL语句是select * from T order by time offset 333 limit 5

第二次要改写成一个between语句，between的起点是time_min，between的终点是原来每个分库各自返回数据的最大值：

第一个分库，第一次返回数据的最大值是1487501523

所以查询改写为select * from T order by time where time between time_min and 1487501523

第二个分库，第一次返回数据的最大值是1487501323

所以查询改写为select * from T order by time where time between time_min and 1487501323

第三个分库，第一次返回数据的最大值是1487501553

所以查询改写为select * from T order by time where time between time_min and 1487501553

相对第一次查询，第二次查询条件放宽了，故第二次查询会返回比第一次查询结果集更多的数据，假设这三个分库返回的数据(time, uid)如下：
![图14](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UfZEBnbLunl0E9PD3ABiaO4qbh10Rhpia9ulFluqEs0wUUNgbGjI6nQXg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)
可以看到：

由于time_min来自原来的分库一，所以分库一的返回结果集和第一次查询相同（所以其实这次访问是可以省略的）；

分库二的结果集，比第一次多返回了1条数据，头部的1条记录（time最小的记录）是新的（上图中粉色记录）；

分库三的结果集，比第一次多返回了2条数据，头部的2条记录（time最小的2条记录）是新的（上图中粉色记录）；

步骤四：在每个结果集中虚拟一个time_min记录，找到time_min在全局的offset
![图15](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2UNwLEv3e7jbWncFHtWT9ax2wsI1PicyWTrrPoXs0lrap1z7ibJQAnxSsA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)
在第一个库中，time_min在第一个库的offset是333

在第二个库中，(1487501133, uid_aa)的offset是333（根据第一次查询条件得出的），故虚拟time_min在第二个库的offset是331

在第三个库中，(1487501143, uid_aaa)的offset是333（根据第一次查询条件得出的），故虚拟time_min在第三个库的offset是330

综上，time_min在全局的offset是333+331+330=994

步骤五：既然得到了time_min在全局的offset，就相当于有了全局视野，根据第二次的结果集，就能够得到全局offset 1000 limit 5的记录
![图16](http://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOzEfY6YxsY5W1akTCxMCd2Uic1WHQrVTnicsOdWjwA5ic6cJXpuZy25vHzXyicVy5R1vQHSFUKleOaYDg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)
第二次查询在各个分库返回的结果集是有序的，又知道了time_min在全局的offset是994，一路排下来，容易知道全局offset 1000 limit 5的一页记录（上图中黄色记录）。

 

是不是非常巧妙？这种方法的优点是：可以精确的返回业务所需数据，每次返回的数据量都非常小，不会随着翻页增加数据的返回量。



不足是：需要进行两次数据库查询。

 

五、总结

今天介绍了解决“跨N库分页”这一难题的四种方法：

 

方法一：全局视野法

（1）将order by time offset X limit Y，改写成order by time offset 0 limit X+Y

（2）服务层对得到的N*(X+Y)条数据进行内存排序，内存排序后再取偏移量X后的Y条记录

这种方法随着翻页的进行，性能越来越低。

 

方法二：业务折衷法-禁止跳页查询

（1）用正常的方法取得第一页数据，并得到第一页记录的time_max

（2）每次翻页，将order by time offset X limit Y，改写成order by time where time>$time_max limit Y

以保证每次只返回一页数据，性能为常量。

 

方法三：业务折衷法-允许模糊数据

（1）将order by time offset X limit Y，改写成order by time offset X/N limit Y/N

 

方法四：二次查询法

（1）将order by time offset X limit Y，改写成order by time offset X/N limit Y

（2）找到最小值time_min

（3）between二次查询，order by time between $time_min and $time_i_max

（4）设置虚拟time_min，找到time_min在各个分库的offset，从而得到time_min在全局的offset

（5）得到了time_min在全局的offset，自然得到了全局的offset X limit Y

参考：https://www.jianshu.com/p/198ee07ddd7c
