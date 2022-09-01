最近用MySQL做统计的需求比较多，这里整理一些常用的场景方便后期查阅，同时也是抛砖引玉的过程。其中包括普通的分组统计，连续的每日统计，区间范围统计。
### 普通分组统计
场景一：根据订单状态统计订单数量。
一个很常见，也很简单的统计需求。其中状态字段是订单实体的一个属性。
```
@Query("SELECT status, COUNT(id) FROM Order GROUP BY status")
fun summaryOrderByStatus(): Array<Array<String>>?
```
场景二：根据订单中商品类目统计订单数量和金额。
比场景一稍微麻烦了一点，商品字段是订单实体的一个属性，而类目字段才是商品实体的一个属性。参考代码：（Kotlin语法）
```
@Query("SELECT commodity.category, COUNT(id), SUM(finalPrice) FROM Order GROUP BY commodity.category")
fun summaryOrderByCommodityCategory(): Array<Array<String>>?
```
小结：
1. 分组统计少不了GROUP BY语句，如果需要加查询条件，请在其前面添加 WHERE 语句。
2. 统计数量用COUNT，统计总和用SUM函数，有GROUP BY的地方，少不了这些聚合函数。
3. 统计返回的结果是字符串类型的二维数组。
4. 以内嵌属性分组，如果是SpringDataJpa框架，则可以直接通过”实体类.属性名”的方式。

### 每日统计
在做每日，每周，每月统计时，遇到返回日期不是连续的情况。
原因是数据库中没有值，而我们理想状态应该是：如果没有值则默认为零，使其数据是连续的日期。

场景三：统计结果日期可能不连续
如果数据库中某个时间段没有值，那统计出来的结果会缺这段时间。参考代码：（sql语句）
```
-- 统计每日
SELECT DATE_FORMAT(create_date,'%Y-%m-%d') as days, COUNT(id) count FROM order GROUP BY days;
-- 统计每周
SELECT DATE_FORMAT(create_date,'%Y-%u') as weeks, COUNT(id) count FROM order GROUP BY weeks;
-- 统计每月
SELECT DATE_FORMAT(create_date,'%Y-%m') as months, COUNT(id) count FROM order GROUP BY months;
```
场景四：统计结果日期连续
要让日期连续，又要代码优雅。说实话，困扰了我很久，一直没有找到很好的解决方法，虽然目前这个方法很挫。但可以解决问题。毕竟抓到老鼠的都是好猫。如果各位有好的建议，望赐教！

解决思路：
第一步：创建一张date_summary辅助表，字段只需要有date和count（默认值为零）。
第二步：先向date_summary表插入10年内的数据。
第三步：通过UNION ALL 联合查询，将空缺的日期补上。
第二步参考代码（Kotlin语法）

第二步参考代码（Kotlin语法）
```
val startDate = Calendar.getInstance()
startDate.set(2018, 6, 1)
val startTIme = startDate.timeInMillis
val endDate = Calendar.getInstance()
endDate.set(2028, 11, 30)
val endTime = endDate.timeInMillis
val oneDay = 1000 * 60 * 60 * 24L
var time = startTIme
val dates: MutableList<DateSummary> = arrayListOf()
while (time<=endTime) {
   val dateSummary = DateSummary()
   dateSummary.date = SimpleDateFormat("yyyy-MM-dd").format(Date(time))
   dateSummary.count = 0
   dates.add(dateSummary)
   time += oneDay
}
dateSummaryRepository.saveAll(dates)
```
第三步统计每日的SQL语句
```
SELECT
   summary.oneDay,
   summary.count 
FROM
   (
   SELECT
       DATE_FORMAT( created_date, '%Y-%m-%d' ) oneDay,
       COUNT(id) count 
   FROM
       service_order 
   WHERE created_date BETWEEN "2018-06-01" and "2018-08-01"
   GROUP BY oneDay 
   UNION ALL
       (
       SELECT
           DATE_FORMAT( date, '%Y-%m-%d' ) templateDay,
           count
       FROM
           date_summary
       WHERE date BETWEEN "2018-06-01" and "2018-08-01"
       GROUP BY
           templateDay
       ) 
   ) summary 
GROUP BY
   summary.oneDay 
ORDER BY
   summary.oneDay ASC
```
小结：
MySQL的DATE_FORMAT(date,format) 函数用于以不同的格式显示日期/时间数据，文章后面会详细介绍
MySQL的UNION 操作符用于合并两个或多个SELECT语句的结果集，文章后面会详细介绍
### 区间范围统计

这是一个较为常见的需求，比如按照年龄段统计人员分布情况，甚至要求分别统计男女人数分布情况。

场景五：根据小区年龄段统计人数
只根据年龄范围统计，没有其他限制条件，使用SUM只需要加一。
```
SELECT INTERVAL(age,10,20,30,40,50,60,70,80,90) AS ageRatio, 
SUM(1) AS count FROM user GROUP BY ageRatio
```
场景六：根据小区年龄段统计男女人数
在场景五的基础上多了一个区分性别，用流程控制函数来设置SUM加一的情况。
```
SELECT INTERVAL(age,10,20,30,40,50,60,70,80,90) AS ageRatio, 
SUM(CASE WHEN sex=1 THEN 1 ELSE 0 END) AS male,
SUM(CASE WHEN sex=0 THEN 1 ELSE 0 END) AS female FROM user GROUP BY ageRatio
```
小结：
1. 通过区间统计需要使用MySQL的INTERVAL函数，第一个参数是需要比较的字段，后面是比较的区间，值必须从小到大
2. 区间统计的结果也是二维数组，注意返回的结果可能不是连续的（这里的不连续可以用代码解决，毕竟区间数量较少）。第一个参数返回的是区间的下标，从0开始。
3. 当age的值在区间范围内就SUM加一，也可以通过流程控制函数（CASE WHEN THEN ELSE END）来判断是加一还是加零

MySQL知识点

知道现在都是快餐文化，大家都很忙，很少有时间去揣摩各语法的特点。所以先把常用的场景写在前面，语法知识写在后面。
* GROUP BY 分组
1. 分组一般与聚合函数一起使用如SUM，COUNT等
2. GROUP BY 在WHERE 语句之后
* DATE_FORMAT 时间格式化
1. 用来修改时间的格式
2. 语法格式: DATE_FORMAT(date,format) date必须是合格的时间参数，format是输出时间格式
3. 常见的format格式有：
* %Y: 4位数的年，
* %y: 2位数的年，
* %m: 2位数的月（00~12），
* %M: 英文单词的月，
* %d: 2位数的日（00~31），
* %u: 周，星期一是一周的第一条，
* 更多可以访问w3school

* UNION 联合结果
1. UNION可以合并、联合，将多次查询结果合并成一个结果，通过查询结果合并解决了统计不连续的情况。
2. 多条查询语句的列数必须一致，各列的顺序最好一致。场景四中，两条sql都只查询了date和count，且顺序保持一致。
3. union 去重，union all包含重复项

* INTERVAL 比较间距
1. INTERVAL()函数是比较列表(N, arg1, arg2, arg3…argN)中的N值。
2. INTERVAL()函数如果N<arg1则返回0，如果N<arg2则返回1，如果N<arg3则返回2，如果N为NULL，它将返回-1。
3. 列表值必须是arg1 < arg2 < arg3 的形式才能正常工作。

* 流程控制函数
1. case when then else end 是流程控制函数中的一种，还有一种是if函数
2. 使用语法：
```
case 
when 条件1 then 值1
when 条件2 then 值2
...
else 值n
end
```

参见：https://www.cnblogs.com/duhuo/p/14833740.html
