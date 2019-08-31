## 常用排名操作
在开发中经常会用到排名相关需求，在用户数量比较小的情况下使用mysql就可以，下面主要考虑使用mysql来做排名相关操作，比如总排名，指定用户排名等操作。

下面使用如下表为例
```
CREATE TABLE `tbl_score` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `score` int(11) DEFAULT NULL COMMENT '得分',
  `created_time` int(11) DEFAULT NULL COMMENT '得分时间',
  PRIMARY KEY (`id`),
  KEY `i_score` (`score`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='得分表'
```
思路如下：可以先排序，再对结果进行编号；也可以先查询结果，再排序编号。

### 普通排名：

方法一：

```
SELECT
  t.*,
  @rank := @rank + 1 AS rank
FROM (SELECT
         @rank := 0) r,
     (SELECT
         *
       FROM tbl_score
       ORDER BY score DESC) AS t;
```

方法二：

```
SELECT
  t.*,
  @rank := @rank + 1 AS rank
FROM (SELECT
         @rank := 0) r,
     tbl_score AS t
ORDER BY t.score DESC;
```

针对@rank等的说明如下：
* @rank := @rank + 1 中 := 是赋值的作用，这句话的意思是先执行@rank + 1，然后把值赋给@rank；
* (SELECT @rank := 0) r 这句话的意思是设置rank字段的初始值为0，即编号从1开始。

### 查看指定用户排名：

例如查询id=2的玩家排名
方法一：
```
SELECT
  b.*
FROM (SELECT
    t.*,
    @rank := @rank + 1 AS rank
  FROM (SELECT
           @rank := 0) r,
       (SELECT
           *
         FROM tbl_score
         ORDER BY score DESC) AS t) AS b
WHERE b.id = 2;
```
方法二：

```
SELECT
  b.*
FROM (SELECT
    t.*,
    @rank := @rank + 1 AS rank
  FROM (SELECT
           @rank := 0) r,
       tbl_score AS t
  ORDER BY t.score DESC) AS b
WHERE b.id = 2;
```

### 实现并列排名（相同分数排名相同）：

```
SELECT
  obj.id,
  obj.score,
  CASE
	WHEN @rowtotal = obj.score
	THEN @rownum
	WHEN @rowtotal := obj.score
	THEN @rownum := @rownum + 1
	WHEN @rowtotal = 0
	THEN @rownum := @rownum + 1
   END AS rownum
FROM (SELECT
         id,
         score
       FROM tbl_score
       ORDER BY score DESC) AS obj,
     (SELECT
         @rownum := 0,
         @rowtotal := NULL) r
```
### 查询指定用户并列排名:

```
SELECT
  total.*
FROM (SELECT
    obj.id,
    obj.score,
    CASE
	WHEN @rowtotal = obj.score
	THEN @rownum
	WHEN @rowtotal := obj.score
	THEN @rownum := @rownum + 1
	WHEN @rowtotal = 0
	THEN @rownum := @rownum + 1
	END AS rownum
  FROM (SELECT
           id,
           score
         FROM tbl_score
         ORDER BY score DESC) AS obj,
       (SELECT
           @rownum := 0,
           @rowtotal := NULL) r) AS total
WHERE total.id = 2;
```

参考：
* https://github.com/weifansym/dbDoc/blob/master/redis/zset-same-score.md
