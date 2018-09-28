## CAS下ABA问题及优化方案
### 一、并发业务场景
库存业务，stock(sid, num)，其中：
•sid为库存id
•num为库存值

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set007.png)

如上图所示，两个并发的查询库存操作，同时从数据库都得到了库存是5。

接下来用户发生了并发的库存扣减动作：

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set008.png)

如上图所示：
•用户1购买了3个库存，于是库存要设置为2
•用户2购买了2个库存，于是库存要设置为3
这两个设置库存的接口并发执行，库存会先变成2，再变成3，导致数据不一致（实际卖出了5件商品，但库存只扣减了2，最后一次设置库存会覆盖和掩盖前一次并发操作）

### 二、不一致原因分析
出现数据不一致的根本原因，是设置操作发生的时候，没有检查库存与查询出来的库存有没有变化，理论上：
•仅库存为5的时候，用户1的库存设置2才能成功
•仅库存为5的时候，用户2的库存设置3才能成功

实际执行的时候：
•库存为5，用户1的set stock 2确实应该成功
•库存变为2了，用户2的set stock 3应该失败掉

### 三、CAS优化
大家常说的“Compare And Set”（CAS），是一种常见的降低读写锁冲突，保证数据一致性的乐观锁机制。

针对上述库存扣减的例子，CAS升级很容易，将库存设置接口执行的SQL：
update stock set num=$num_new where sid=$sid
升级为：
update stock set num=$num_new where sid=$sid and num=$num_old
即可。

### 四、什么是ABA问题
CAS乐观锁机制确实能够提升吞吐，并保证一致性，但在极端情况下可能会出现ABA问题。

什么是ABA问题？
考虑如下操作：
•并发1（上）：获取出数据的初始值是A，后续计划实施CAS乐观锁，期望数据仍是A的时候，修改才能成功
•并发2：将数据修改成B
•并发3：将数据修改回A
•并发1（下）：CAS乐观锁，检测发现初始值还是A，进行数据修改

上述并发环境下，并发1在修改数据时，虽然还是A，但已经不是初始条件的A了，中间发生了A变B，B又变A的变化，此A已经非彼A，数据却成功修改，可能导致错误，这就是CAS引发的所谓的ABA问题。

库存操作，出现ABA问题并不会对业务产生影响。

再看一个堆栈操作的例子：

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set009.png)
并发1（上）：读取栈顶的元素为“A1”

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set010.png)
并发2：进行了2次出栈

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set011.png)
并发3：又进行了1次出栈、

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set012.png)
并发1（下）：实施CAS乐观锁，发现栈顶还是“A1”，于是修改为A2

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set013.png)
此时会出现系统错误，因为此“A1”非彼“A1”
### 五、ABA问题的优化
ABA问题导致的原因，是CAS过程中只简单进行了“值”的校验，再有些情况下，“值”相同不会引入错误的业务逻辑（例如库存），有些情况下，“值”虽然相同，却已经不是原来的数据了。

优化方向：CAS不能只比对“值”，还必须确保的是原来的数据，才能修改成功。

常见实践：“版本号”的比对，一个数据一个版本，版本变化，即使值相同，也不应该修改成功。

库存的并发读写例子，引入版本号的具体实践如下：
（1）库存表由
stock(sid, num)
升级为
stock(sid, num, version)

（2）查询库存时同时查询版本号
```
select num from stock where sid=$sid
```
升级为
```
select num, version from stock where sid=$sid
```

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set014.png)
假设有并发操作，都会将版本号查询出来

（3）设置库存时，必须版本号相同，并且版本号要修改
旧版本“值”比对CAS
update stock set num=$num_new where sid=$sid and num=$num_old
升级为“版本号”比对CAS
```
update stock set num=$num_new, version=$version_new
 where sid=$sid and version=$version_old
```

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set015.png)
此时假设有并发操作，第一个操作，比对版本号成功，于是把库存和版本号都进行了修改。

![并发](https://github.com/weifansym/dbDoc/blob/master/images/mysql/set016.png)
同时存在的第二个并发操作，比对版本号发生了变化，也是库存应该修改失败。

### 六、总结
•select&set业务场景，在并发时会出现一致性问题
•基于“值”的CAS乐观锁，可能导致ABA问题
•CAS乐观锁，必须保证修改时的“此数据”就是“彼数据”，应该由“值”比对，优化为“版本号”比对

转自：https://www.w3cschool.cn/architectroad/architectroad-cas-optimization.html
