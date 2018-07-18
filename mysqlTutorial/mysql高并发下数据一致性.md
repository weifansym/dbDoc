## 利用事务处理：
常见错误demo如下：
```
BEGIN;  
SELECT book_number FROM book WHERE book_id = 123;  
// ...  
UPDATE book SET book_numberbook_number = book_number - 1 WHERE book_id = 123;  
COMMIT; 
```
答案是否定了，这样依然不能避免问题的发生，如果想避免这样的情况，实际应该如下：
```
BEGIN;  
SELECT book_number FROM book WHERE book_id = 123 FOR UPDATE;  
// ...  
UPDATE book SET book_numberbook_number = book_number - 1 WHERE book_id = 123;  
COMMIT; 
```
由于加入了FOR UPDATE，所以会在此条记录上加上一个行锁，如果此事务没有完全结束，那么其他的事务在使用SELECT ... FOR UPDATE请求的时候就会处于等待状态，
直到上一个事务结束，它才能继续，从而避免了问题的发生，需要注意的是，如果你其他的事务使用的是不带FOR UPDATE的SELECT语句，将得不到这种保护。
### 先来明确一下事务涉及的相关知识：
事务都应该具备**ACID**特征。所谓ACID是Atomic（原子性），Consistent（一致性），Isolated（隔离性），Durable（持续性）四个词的首字母所写，
下面以“银行转帐”为例来分别说明一下它们的含义：

* 原子性：组成事务处理的语句形成了一个逻辑单元，不能只执行其中的一部分。换句话说，事务是不可分割的最小单元。比如：银行转帐过程中，
必须同时从一个帐户减去转帐金额，并加到另一个帐户中，只改变一个帐户是不合理的。

* 一致性：在事务处理执行前后，MySQL数据库是一致的。也就是说，事务应该正确的转换系统状态。比如：银行转帐过程中，要么转帐金额从一个帐户转入另一个帐户，
要么两个帐户都不变，没有其他的情况。

* 隔离性：一个事务处理对另一个事务处理没有影响。就是说任何事务都不可能看到一个处在不完整状态下的事务。比如说，银行转帐过程中，在转帐事务没有提交之前，
另一个转帐事务只能处于等待状态。

* 持续性：事务处理的效果能够被永久保存下来。反过来说，事务应当能够承受所有的失败，包括服务器、进程、通信以及媒体失败等等。比如：银行转帐过程中，
转帐后帐户的状态要能被保存下来。

再来看看哪些问题会用到事务处理：
这里不说“银行转帐”的例子了，说一个大家实际更容易遇到的“网上购书”的例子。先假设一下问题的背景：网上购书，某书（MySQL数据库编号为123）只剩最后一本，
而这个时候，两个用户对这本书几乎同时发出了购买请求，让我们看看整个过程：

在具体分析之前，先来看看数据表的定义：
```
create table book  
(  
book_id unsigned int(10) not null auto_increment,  
book_name varchar(100) not null,  
book_price float(5, 2) not null, #我假设每本书的价格不会超过999.99元  
book_number int(10) not null,  
primary key (book_id)  
)  
type = innodb; #engine = innodb也行 
```
对于用户甲来说，他的动作稍微比乙快一点点，其购买过程所触发的动作大致是这样的：
```
1. SELECT book_number FROM book WHERE book_id = 123;

book_number大于零，确认购买行为并更新book_number

2. UPDATE book SET book_number = book_number - 1 WHERE book_id = 123;

购书成功
```
而对于用户乙来说，他的动作稍微比甲慢一点点，其购买过程所触发的动作和甲相同：
```
1. SELECT book_number FROM book WHERE book_id = 123;

这个时候，甲刚刚进行完第一步的操作，还没来得及做第二步操作，所以book_number一定大于零
2. UPDATE book SET book_number = book_number - 1 WHERE book_id = 123;

购书成功
```
表面上看甲乙的操作都成功了，他们都买到了书，但是库存只有一本，他们怎么可能都成功呢？再看看数据表里book_number的内容，已经变成“-1”了，
这当然是不能允许的（实际上，声明这样的列类型应该加上unsigned的属性，以保证其不能为负，这里是为了说明问题所以没有这样设置）

好了，问题陈述清楚了，再来看看怎么利用事务来解决这个问题，打开MySQL手册，可以看到想用事务来保护你的SQL正确执行其实很简单，
基本就是三个语句：开始，提交，回滚。
* 开始：START TRANSACTION或BEGIN语句可以开始一项新的事务

* 提交：COMMIT可以提交当前事务，是变更成为永久变更

* 回滚：ROLLBACK可以回滚当前事务，取消其变更

此外，SET AUTOCOMMIT = {0 | 1}可以禁用或启用默认的autocommit模式，用于当前连接。

那是不是只要用事务语句包一下我们的SQL语句就能保证正确了呢？比如下面代码：
```
BEGIN;  
SELECT book_number FROM book WHERE book_id = 123;  
// ...  
UPDATE book SET book_numberbook_number = book_number - 1 WHERE book_id = 123;  
COMMIT;  
```
答案是否定了，这样依然不能避免问题的发生，如果想避免这样的情况，实际应该如下：
```
BEGIN;  
SELECT book_number FROM book WHERE book_id = 123 FOR UPDATE;  
// ...  
UPDATE book SET book_numberbook_number = book_number - 1 WHERE book_id = 123;  
COMMIT;  
```
由于加入了FOR UPDATE，所以会在此条记录上加上一个行锁，如果此事务没有完全结束，那么其他的事务在使用SELECT ... FOR UPDATE请求的时候就会处于等待状态，
直到上一个事务结束，它才能继续，从而避免了问题的发生，需要注意的是，如果你其他的事务使用的是不带FOR UPDATE的SELECT语句，将得不到这种保护。
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

