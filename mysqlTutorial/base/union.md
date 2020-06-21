### UNION和UNION ALL的使用
在数据库中，UNION和UNION ALL关键字都是将两个结果集合并为一个。

组合查询适用于下面两种情境中：
* 从多个表中查询出相似结构的数据，并且返回一个结果集
* 从单个表中多次SELECT查询，将结果合并成一个结果集返回
### MySQL中的UNION
UNION在进行表链接后会筛选掉重复的记录，所以在表链接后会对所产生的结果集进行排序运算，删除重复的记录再返回结果。
实际大部分应用中是不会产生重复的记录，最常见的是过程表与历史表UNION。如：
```
select * from gc_dfys union select * from ls_jg_dfys
```
这个SQL在运行时先取出两个表的结果，再用排序空间进行排序删除重复的记录，最后返回结果集，如果表数据量大的话可能会导致用磁盘进行排序。
### MySQL中的UNION ALL
而UNION ALL只是简单的将两个结果合并后就返回。这样，如果返回的两个结果集中有重复的数据，那么返回的结果集就会包含重复的数据了。
从效率上说，UNION ALL 要比UNION快很多，所以，如果可以确认合并的两个结果集中不包含重复的数据的话，那么就使用UNION ALL，如下：
```
select * from gc_dfys union all select * from ls_jg_dfys
```
使用Union，则所有返回的行都是唯一的，如同您已经对整个结果集合使用了DISTINCT
使用Union all，则不会排重，返回所有的行
上面都是针对不同表进行处理的，其实也可以针对单个表处理，比如对表tbl_users进行不同条件的查询
```
select user_id,user_nickname,user_status from tbl_users where user_status = 1; // 第一次查询
select user_id,user_nickname,user_status from tbl_users where user_id > 3; // 第二次查询
```
上面的两个查询就可以进行UNION
```
select user_id,user_nickname,user_status from tbl_users where user_status = 1 
UNION
select user_id,user_nickname,user_status from tbl_users where user_id > 3
```
这条语句由前面的两条语句组成，通过Union组合了两条SELECT，并且把结果集合并后输出。这条组合查询也可以使用同等where语句来替代:
```
select user_id,user_nickname,user_status from tbl_users where user_status = 1 or user_id > 3;
```
### Union使用规则
Union有他的强大之处，详细介绍之前，首先明确一下Union的使用注意规则。
* Union必须由两条或者两条以上的SELECT语句组成，语句之间使用Union链接。
* Union中的每个查询必须包含相同的列、表达式或者聚合函数，他们出现的顺序可以不一致（这里指查询字段相同，表不一定一样）
* 列的数据类型必须兼容，兼容的含义是必须是数据库可以隐含的转换他们的类型
### 添加其他条件
如果您想使用ORDER BY或LIMIT子句来对全部UNION结果进行分类或限制，则应对单个地SELECT语句加圆括号，并把ORDER BY或LIMIT放到最后一个的后面：
```
(SELECT a FROM tbl_name WHERE a=10 AND B=1)   
UNION 
(SELECT a FROM tbl_name WHERE a=11 AND B=2) 
ORDER BY a LIMIT 10; 
```
麻烦一点也可以这么干：
```
select userid from ( 
select userid from testa union all select userid from testb) t  
order by userid limit 0,1; 
```
如果你还想group by，而且还有条件，那么：
```
select userid from (select userid from testa union all select userid from testb) t group by userid having count(userid) = 2; 
```
注意：在union的括号后面必须有个别名，否则会报错
### 区分不同来源
比如两个表union，user表和posts表，虽然结果混合在一起没有任何问题，但是当显示到页面的时候，我们需要给用户和文章不同的链接或者其他的区分。
所以我们必须确定该条记录来自于哪张表，我们可以添加一个别名来作为表名。
```
select posts_id,posts_name,posts_status,'users' as table_name from yy_posts
UNION
select user_id,user_nickname,user_status,'posts' as table_name from yy_user
```
即上面的返回结果的table_name列会是不同值。
