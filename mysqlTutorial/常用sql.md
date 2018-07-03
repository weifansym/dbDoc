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
在上面的两种方式中id加索引，第一种比较好
