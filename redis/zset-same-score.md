## zset中在相同score下相关排名问题
问题描述
排行榜主要分为两种，一种是并列排行榜（存在相同排名的情况），一种是严格排行榜（分先后顺序，不存在并列名次）。

一般根据不同的业务场景，选用不同的排行榜。例如，对于存在实物奖励且前一名与后一名的奖品差距很大时，往往采用严格排行榜，而对于只是激励用户的场景，则选用并列排行榜。

下面，通过举两个例子，介绍一下这两种排行榜。
假设存在一张表 tbl_score，原始数据如图：
![](https://user-gold-cdn.xitu.io/2018/8/23/1656712316851bba?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
tbl_score 表

用到的表和数据：
```
CREATE TABLE `tbl_score` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `score` int(11) DEFAULT NULL COMMENT '得分',
  `created_time` int(11) DEFAULT NULL COMMENT '得分时间',
  PRIMARY KEY (`id`)
) COMMENT='得分表';

INSERT INTO `tbl_score` (`id`, `score`, `created_time`)
VALUES
    (1, 90, 1534429870),
    (2, 80, 1534429871),
    (3, 82, 1534412273),
    (4, 96, 1534429243),
    (5, 100, 1534429133),
    (6, 5, 1534429273),
    (7, 8, 1534429823),
    (8, 80, 1534429801);
```
### 方式一：并列排行榜
经过排行后的排行结果如图：
![](https://user-gold-cdn.xitu.io/2018/8/23/16567123166c7af0?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
可以看到，相同得分情况下，名次相同。下一位，名次为当前用户顺序位。例如，两名第五名，则下一位为第七名，
### 方式二：严格排行榜
严格排行榜，通过多级排行，排列出有先后次数的排名。在本例中，当相同得分的情况下，根据时间进行二次排序，最先得分的名次越高。 排行结果如图：
![](https://user-gold-cdn.xitu.io/2018/8/23/16567123167bc3a9?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
## 并列排行榜的解决方法
### MySQL 实现
```
SELECT `id`, `score`,
    IFNULL((SELECT COUNT(*) FROM `tbl_score` WHERE `score` > `t`.`score`), 0) + 1 AS `rank`  # 计算并列排名
FROM `tbl_score` t
ORDER BY rank ASC
```
通过 (SELECT COUNT(*) FROM `tbl_score` WHERE `score` > `t`.`score`)，获取排序。计算原理是比较出比当前分数要大的条数，然后加1，获取当前排序。例如，排名第一的得分，筛选出比当前大的得分行数为0，然后加1，得排名为 1。

### 逻辑层实现排行
```
// data 为已根据 score DESC 排列的数据

const ranked = data.map(function(item, i) {
    if (i > 0) {
        // 获取上一个元素
        var prevItem = data[i - 1];
        if (prevItem.score == item.score) {
            // 得分相同，则排序相同
            item.rank = prevItem.rank;
        } else {
            // 得分不相同，则排序 + 1
            item.rank = i + 1;
        }
    } else {
        // 第一个数据，排序为 1
        item.rank = 1;
    }

    return item;
});
```
## 精确排行榜的解决方法
### MySQL 实现
根据多级条件进行排序，本例中以得分、时间为条件进行排序。优先对得分按照降序进行排序，其次是以时间升序进行排序。得分高且获得分数越早的玩家，排序越靠前。
最后，计算行号得到排名。
```
SELECT `id`,`score`, `created_time`, (@rowNum := @rowNum + 1) as rank
FROM tbl_score, (SELECT @rowNum := 0) b
ORDER BY `score` DESC, `created_time` ASC
```
### Redis 实现
主要利用Redis的有序数列集合（zset）实现。

实现原理
有序集合由三部分组成，KEY（键）、score（成员的得分）、member（成员）。有序集合的每一项，都是以键值对的形式存储，每一项都有一个分数。有序集合会根据score自动排序。利用这个特性，我们就可以实现排行榜了。

scoro 是数字类型，可以是整形也可以是浮点型。按照排行榜多级排序的要求，相同分值下按照先来后到的顺序排序（创建时间越早，排序越高），但是Redis相同分值，是按照 member 的 ASCII码进行排序。
如果直接将得分作为有序集合的 score，得不到我们想要的效果。
![](https://user-gold-cdn.xitu.io/2018/8/23/1656712316820a1f?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

所以，需要将 score进行改造，同时记录得分与时间信息。实现方式有两种：

score 为整数。得分 + 时间差。
score 为浮点数。整数部分使用得分，小数部分使用时间差。
假设得分为 10， 得分时间为 1534649521（Unix时间戳。2018/8/19 11:32:01）, 截止时间为 1534694400（Unix时间戳。2018/8/20 0:0:0。 若无截止时间，取值为 9999999999）。

#### 方式一：
```
10 + (1534694400 - 1534649521) = 44889
```
#### 方式二：
```
10.44879
```
选第二种方式的好处是，当需求不仅需要排序，还需展示得分时，可以将 score 强制转化成整形，即可获取到得分。需要注意的是，得分最好不要太大， score得分尽量控制在16位以下（浮点数时，小数点前后位数和不要超过16位，最好15位）。超过16位后，score值存入redis，会发生精度丢失。
![](https://user-gold-cdn.xitu.io/2018/8/23/1656712339b2b6de?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
超过16位，精度发生丢失
### 获取排行榜
ZREVRANGE test 0 -1 withscores
### 实现步骤
* 排行榜
* 相同得分，按照先来后到的顺序
* redis有序集合
* 计算score值
* 得到排序排行榜
### 总结
本文主要对并列排行榜和精确排行榜的问题进行了分析，采用Redis 或MySQL的方式解决排行榜问题。在使用Redis解决精确排行榜问题时，遇到了 score 精度问题。开发者需要特别注意此点，对于特别大的 score时，需要特别处理。例如，将大数值转换成小数值。

关于并列排行榜处理问题，在实践中仍然存在一些问题。例如，对于排序计算较复杂的场景。我们会使用定时任务提前计算好排行榜，然后将数据写入缓存中。这样，用户在拉取排行榜时能得到较快响应。

但是当既需要展示排名，又需要展示得分信息，且需要保证获取的数组是按序时，为了方便查询时，较快获取排名、得分。我采用的方式是，将排名、得分分别写入两个 zset中。理想状态下，期望写一个 zset，并同时储存排名、得分信息，且方便取出，又不会丢失精度。目前，没有找到这种解决办法。

参考文章
* [基于redis排行榜的实战总结](https://www.cnblogs.com/mumuxinfei/p/5337329.html)
* [Redis数据结构实际应用场景之排行榜](https://zhuanlan.zhihu.com/p/25729411)
* [【LeetCode】178.分数排名](https://blog.csdn.net/wal1314520/article/details/80107833)
* [使用Redis Zset来处理活动常用排行榜（精确排行）](https://segmentfault.com/a/1190000011737336)
* [mysql 计算排名，生成排行榜](https://segmentfault.com/a/1190000014386692)
* [redis精度](https://www.v2ex.com/t/396897)
