## 赶集mysql军规
总是在灾难发生后，才想起容灾的重要性。
总是在吃过亏后，才记得曾经有人提醒过。



一，核心军规

不在数据库做计算，cpu计算务必移至业务层

控制单表数据量，单表记录控制在千万级

控制列数量，字段数控制在20以内

平衡范式与冗余，为提高效率可以牺牲范式设计，冗余数据

拒绝3B(big)，大sql，大事务，大批量



二，字段类军规

用好数值类型
tinyint(1Byte)
smallint(2Byte)
mediumint(3Byte)
int(4Byte)
bigint(8Byte)
bad case：int(1)/int(11)

有些字符转化为数字
用int而不是char(15)存储ip

优先使用enum或set
例如：`sex` enum (‘F’, ‘M’)

避免使用NULL字段
NULL字段很难查询优化
NULL字段的索引需要额外空间
NULL字段的复合索引无效
bad case：
`name` char(32) default null
`age` int not null
good case：
`age` int not null default 0

不在数据库里存图片



三，索引类军规

谨慎合理使用索引
改善查询、减慢更新
索引一定不是越多越好（能不加就不加，要加的一定得加）
覆盖记录条数过多不适合建索引，例如“性别”

字符字段必须建前缀索引

不在索引做列运算
bad case：
select id where age +1 = 10;

innodb主键合理使用自增列
主键建立聚簇索引
主键不应该被修改
字符串不应该做主键
如果不指定主键，innodb会使用唯一且非空值索引代替

不用外键，请由程序保证约束



四，sql类军规

sql语句尽可能简单
一条sql只能在一个cpu运算
大语句拆小语句，减少锁时间
一条大sql可以堵死整个库

简单的事务
事务时间尽可能短
bad case：
上传图片事务

避免使用触发器，用户自定义函数，请由程序取而代之

不用select *
消耗cpu，io，内存，带宽
这种程序不具有扩展性

OR改写为IN()

OR改写为UNION

画外音：最新的mysql内核已经进行了相关优化

limit高效分页
limit越大，效率越低
select id from t limit 10000, 10;
应该改为 =>
select id from t where id > 10000 limit 10;

使用union all替代union，union有去重开销

尽量不用连接join

务必请使用“同类型”进行比较，否则可能全表扫面

打散批量更新

使用新能分析工具
show profile;
mysqlsla;
mysqldumpslow;
explain;
show slow log;
show processlist;
show query_response_time(percona)

