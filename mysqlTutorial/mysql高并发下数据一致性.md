
### 1.通过悲观锁实现 for update。
这个操作必须在一个事务中进行，如下：
```
BEGIN;  
SELECT book_number FROM book WHERE book_id = 123 FOR UPDATE;  
// ...  
UPDATE book SET book_numberbook_number = book_number - 1 WHERE book_id = 123;  
COMMIT;
```
由于加入了FOR UPDATE，所以会在此条记录上加上一个排他的行锁，如果此事务没有完全结束，那么其他的事务在使用SELECT ... FOR UPDATE请求的时候就会处于等待状态，
直到上一个事务结束，它才能继续，从而避免了问题的发生，需要注意的是，如果你其他的事务使用的是不带FOR UPDATE的SELECT语句，将得不到这种保护。

关于事务：https://zhuanlan.zhihu.com/p/29166694

### 2.通过乐观锁实现，加字段
这种情况就是常说的CAS的问题了，由于CAS中会出现ABA问题，所以通过为每行数据新加一个版本号来处理。
具体请看[CAS-ABA](https://github.com/weifansym/dbDoc/blob/master/mysqlTutorial/CAS-ABA.md)
### 3.同一进行select&set原子操作
通过如下原子操作：
```
update stock set stock=stock-count where sid=$sid and stock>=count
```
通过update的影响行数进行判断，是否更新成功。

### 4.针对秒杀系统
针对秒杀系统由于并发量比较大，所以可以使用消息队列来进行异步的错峰流控，处理对数据库的写操作

4.通过redis实现，读和写都操作redis。写redis数据时，同时产生一条业务相关联的日志数据。单独开个任务或者消息队列来对日志数据进行读取，获取里面的对数据库的操作。然后进行写数据库。

5.因为redis支持事务，所有写操作可以通过lua脚本来支持对数据库的操作。

6.写update语句时，还可以这样写。update produce p set p.num=$SumNum-$num where p.num=$sumNum and $sumNum-$num>0;

更新某个库存值时，首先获取当前库存量。更新时传入查询到的数量。减出此次要操作的数量。加上两个限制条件：

1.查询到的数量和数据库里面的库存数量一致

2.此次操作后，库存数量大于0。

## 利用锁，防止重复提交
例如利用redis的单线程模式,构建一个Redis锁，来对重复提交进行过滤。
```
async setNx(key, value, exp){
      exp = exp || 5;
      return redisClient.getRedisClient().set(key, value, 'EX', exp, 'NX');
    }
```
在多次快速提交情况下，第一次会向redis中添加一个key。来构建一个锁，其他相同请求到来时，会首先检查锁是否存在，存在给出相应提示。第一个请求处理完成后，
删除前面的redis的key。
```
async delKey(key) {
        return new Promise((resolve, reject)=> {
            redisClient.getRedisClient().del(key);
            resolve()
        })
    }
```
## mysql中对数据添加唯一主键，或者多列构成unique索引。
下面以一个用户自选股为例，

