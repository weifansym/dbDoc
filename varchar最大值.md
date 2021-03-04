MySQL varchar 类型最大值，原来一直都理解错了
### 写在前面
关于MySQL varchar字段类型的最大值计算，也许我们一直都理解错误了，本文从问题出发，经实践验证得出一些实用经验，希望对大家的开发工作有些帮助~

### 背景描述
最近同事在做技术方案设计时候，考虑到一个表设计时希望利用varchar类型进行存储，而不是采用text，那就需要确定下varchar允许的最大长度是多少，用来评估下后期是否会遇到存储长度瓶颈。

那问题来了：MySQL 数据库的varchar字段类型最大存储长度到底是多少？

### 问题分析
一切以官方文档为准，翻了下官方描述如下：
```
In MySQL 4.1 the length is always 1 byte. In MySQL 5.0 the length may be either 1 byte (for up to 255) or 2 bytes (for 256 to 65535).
```
大概意思就是说：

在MySQL 4.1中，长度总是1个字节。

在MySQL 5.0以后，长度可以是1字节（最多255个字节）或2个字节（256到65535）

按照官网说法最大值是65535bytes，utf8mb4编码情况下每个字符占4个bytes，最大值应该为16383.75
即：65535/4=16383.75
## 实践验证
到此貌似已经有了结论了，但实际情况是这样的么？

我们来实验下试试看？
```
mysql 版本：
select version(); // 5.7
```
1、若一个表只有一个varchar类型
定义如下：
```
CREATE TABLE t1 (
  c varchar(N) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
那表 t1 的`c`字段的最大长度N为多少呢？即：（65535−1−2）/4=16383
> 备注：
减1的原因是实际行存储从第二个字节开始;
减2的原因是varchar头部的2个字节表示长度;
除4的原因是字符编码是utf8mb4。

2）若表中包含其他多种类型的情况呢
定义如下：
```
CREATE TABLE `t2` (
  `c1` int(10) DEFAULT NULL,
  `c2` char(32) DEFAULT NULL,
  `c3` varchar(N) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
那表 t2 的`c`字段的最大长度N为多少呢？即：（65535−1−2−4−32∗4）/4=16350
> 备注：减1、减2的原因同上; 减4的原因是int类型占用4个字节; 减32*4 的原因是utf8mb4编码的char类型占用4个字节（长度32）

我们来验证一下是否如上述推断计算所述：
1）修改t2表c3字段长度为16350
```
alter table `t2` modify column `c3` varchar(16350);
```
执行成功。
2）修改t2表c3字段长度为16351
```
alter table `t2` modify column `c3` varchar(16351);
```
执行失败，报错信息如下：
> Column length too big for column 'name' (max = 16383); use BLOB or TEXT instead.

### 总结一下
Q：varchar到底能存多少个字符？
这与表使用的字符集相关，latin1、gbk、utf8、utf8mb4编码存放一个字符分别需要占1、2、3、4个字节，同时还要考虑到去除其他字段的占用影响。
实践出真知，可以简单试一下之后再下结论。
### 其他热文推进
[隐秘的 MySQL 类型转换](https://xie.infoq.cn/article/8b0e0f71a8aa818d271625c85)
[MySQL explain 中的 rows 究竟是如何计算的？](https://xie.infoq.cn/article/c028ea15eae7470a8d3e7a2bd)
[MySQL 索引问题探究手记](https://xie.infoq.cn/article/714e462e9af596348975ab95a)

