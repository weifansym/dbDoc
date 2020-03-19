##  常用sql语句
博客园：http://www.cnblogs.com/duhuo/tag/MySQL/

### 查询某列最大值的记录
方法一：
```
SELECT *
from `user` as uer
WHERE id = (
  SELECT max(id)
  FROM `user`
)
```
方法二：
```
select *
from `user` as uer
WHERE NOT EXISTS
( SELECT 1 from `user` WHERE id > uer.id);
```
在上面的两种方式中id加索引，第一种比较好。

查询一个字符串字段 最长的一条记录:
https://stackoverflow.com/questions/2357620/maxlengthfield-in-mysql
```
select 
`字段`, length(`字段`) 
from 表名 
where 
length(`字段`) = ( select max(length(`字段`)) from 表名  )
```
### 对两个表的合并查询并排序的操作
例如我有两个相同的表，要从两个表里面查询出数据然后合并，方式如下：
#### 单独查询，然后代码里面组合，并排序
#### 通过union操作：
```
(SELECT * FROM table_a ORDER BY create_time limit 10)
union all
(SELECT * FROM table_b ORDER BY create_time limit 10)
ORDER BY birthday limit 10
```
### mysql在插入或更新的时候对一个字段赋递增值
在我们有一个需求是更新某个表里面的某个字段，让这个字段变成一个递增的值，或者插入某个表中使得某些字段的值是递增的。下面我们来看看具体的操作：

#### 更改表字段为递增
首先设置一个变量，初始值为任意数值，这里以0为例：
```
set @num:=0;
```
例如我们需要更新rank(排序)这个字段的值。我们可以这样处理
```
update tablename set rank=(@num:= @num+1)
```
#### 添加主键
同时也可以给一个没有主键的数据表添加主键，例如给表test新加字段id，对这个id字段进行递增操作，然后再设置为主键。
```
SET @r:=0;
UPDATE test SET id=(@r:=@r+1);
```
#### 插入递增数据
如果要是向一个表里面插入数据，可以如下操作，例如，我想向临时表temp表中插入数据，并且保证temp中rank字段是递增的，写法如下：
```
start TRANSACTION;
SET @rank:= 20;
INSERT into tbl_live_tab_relation(type, tab_id, relate_id, rank, source)
SELECT 2,1, id, @rank:= @rank + 1, 0
from tbl_live_room
WHERE status=1 and id not in (
  SELECT relation.relate_id
from tbl_live_tab_relation as relation
WHERE relation.tab_id=1 AND relation.type=2
)
order by start_time DESC;
COMMIT;
```
### sum后保留小数
例如保留2位
```
SELECT cast(sum(column_a+column_b) AS decimal(15,2)) FROM `tabname`
```
