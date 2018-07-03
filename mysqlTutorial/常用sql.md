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
