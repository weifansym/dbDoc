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



参考：
* https://github.com/weifansym/dbDoc/blob/master/redis/zset-same-score.md
