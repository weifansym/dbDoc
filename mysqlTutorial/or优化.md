## MySQL OR 条件优化
在开发中经常会用到sql的or操作，这里举例来说明使用 or 的弊端，以及改进办法。
```
select f_crm_id from d_dbname1.t_tbname1 where  f_xxx_id = 926067  
and (f_mobile ='1234567891' or f_phone ='1234567891' ) limit 1
```
从查询语句很容易看出，f_mobile和f_phone两个字段都有可能存电话号码，一般思路都是用 or 去一条sql解决，但表数据量一大简直是灾难：
t_tbanme1上有索引**idx_id_mobile(f_xxx_id,f_mobile)**, ** idx_phone(f_phone),idx_id_email(f_id,f_email)** ，explain 的结果却使用了 **idx_id_email** 索引，有时候运气好可能走**idx_id_mobile f_xxx_id**

因为mysql的每条查询，每个表上只能选择一个索引。如果使用了idx_id_mobile 索引，恰好有一条数据，因为有 limit 1 ，那么恭喜很快得到结果；但如果 f_mobile 没有数据，那 f_phone 字段只能在f_id条件下挨个查找，扫描12w行。 or 跟 and 不一样，甚至有开发认为添加 (f_xxx_id,f_mobile,f_phone)不就完美了吗，要吐血了~

那么优化sql呢，很简单（注意f_mobile,f_phone上都要有相应的索引），方法一：
```
(select f_crm_id from d_dbname1.t_tbname1 where  f_xxx_id = 900000  and f_mobile ='1234567891' limit 1 )
UNION ALL 
(select f_crm_id from d_dbname1.t_tbname1 where  f_xxx_id = 900000  and f_phone ='1234567891' limit 1 )
```
两条独立的sql都能用上索引，分查询各自limit，如果都有结果集返回，随便取一条就行。

还有一种优化办法，如果这种查询特别频繁（又无缓存），改成单独的sql执行，比如大部分号码值都在f_mobile上，那就先执行分sql1，有结果则结束，判断没有结果再执行分sql2 ，能减少数据库查询速度，让代码去处理更多的事情，方法二伪代码：
```
sql1 = select f_crm_id from d_dbname1.t_tbname1 where  f_xxx_id = 900000  and f_mobile ='1234567891' limit 1;
sq1.execute();
if no result sql1:
  sql1 = select f_crm_id from d_dbname1.t_tbname1 where  f_xxx_id = 900000  and f_phone ='1234567891' limit 1;
    sql1.execute();
```
复杂一点的场景是不止返回一条记录那么简单，limit 2：
```
select a.f_crm_id from d_dbname1.t_tbname1 as a 
where (a.f_create_time > from_unixtime('1464107527') or a.f_modify_time > from_unixtime('1464107527') )
limit 0,200
```
这种情况方法一、二都需要改造，因为 f_create_time，f_modify_time 都可能均满足判断条件，这样就会返回重复的数据。

方法一需要改造：
```
(select a.f_crm_id from d_dbname1.t_tbname1 as a 
where a.f_create_time > from_unixtime('1464397527')
limit 0,200 )
UNION ALL
(select a.f_crm_id from d_dbname1.t_tbname1 as a 
where a.f_modify_time > from_unixtime('1464397527') and a.f_create_time <= from_unixtime('1464397527')
limit 0,200 )
```
有人说 把 UNION ALL 改成 UNION 不就去重了吗？如果说查询比较频繁，或者limit比较大，数据库还是会有压力，所以需要做trade off。

这种情况更多还是适合方法二，包括有可能需要 order by limit 情况。改造伪代码：
```
sql1 = (select a.f_crm_id from d_dbname1.t_tbname1 as a where a.f_create_time > from_unixtime('1464397527') limit 0,200 );
sql1.execute();
sql1_count = sql1.result.count
if sql1_count < 200 :
  sql2 = (select a.f_crm_id from d_dbname1.t_tbname1 as a where a.f_modify_time > from_unixtime('1464397527') and a.f_create_time <= from_unixtime('1464397527') limit 0, (200 - sql1_count) );
  sql2.execute();

final_result = paste(sql1,sql2);
```
or条件在数据库上很难优化，能在代码里优化逻辑，不至于拖垮数据库。只有在 or 条件下无需索引时（且需要比较的数据量小），才考虑。

相同字段 or 可改成 in，如 f_id=1 or f_id=100 -> f_id in (1,100)。
