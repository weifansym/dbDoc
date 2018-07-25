## MySQL EXISTS
在本节中你会学到怎么使用mysql EXISTS操作，以及什么时候使用它可以提高查询性能
### 介绍 MySQL EXISTS 操作
MySQL EXISTS操作是一个Boolean类型的操作，返回值不是true就是false。MySQL EXISTS操作通常被用在子查询中作为一个是否存在的条件。
下面是MySQL EXISTS的使用命令：

    SELECT 
        select_list
    FROM
        a_table
    WHERE
        [NOT] EXISTS(subquery);
如果子查询返回任何行，则EXISTS操作返回值就是true，否则返回false。

另外，EXISTS操作的原理是：从父查询中取出一行，然后进行子查询，在子查询中一旦找到了一个匹配的行，子查询就会立刻终止接下来的查询操作并返回Boolean值结果。所以在一些场景下你可以使用EXISTS操作来提高查询性能。

一个**NOT**操作是取消**EXISTS**操作的，也就是说，NOT EXISTS操作在子查询返回结果为空行的时候值为true，返回结果的数据行存在的时候为false.

### MySQL EXISTS例子
首先让我们来看一下customers和orders这两张表：

![表结构](http://www.mysqltutorial.org/wp-content/uploads/2009/12/customers_orders_tables.png)

我猜想你肯定会查询：那些用户至少下了一个订单。使用EXISTS操作如下：

    SELECT 
        customerNumber, customerName
    FROM
        customers
    WHERE
        EXISTS( SELECT 
                1
            FROM
                orders
            WHERE
                orders.customernumber = customers.customernumber);

对于**customers**表中的每一行，都会去**orders**表中查询是否存在两个表中customernumber值相等的条件。如果customers表中的customernumber值在orders表中也存在。子查询会返回第一个匹配的行，则EXISTS操作返回的就是true，并停止浏览查询orders表。否则子查询没有结果返回，此时的EXISTS值为false。
 
获取那些用户没有下过订单：我们可以使用**NOT EXISTS**操作。如下：

    SELECT 
        customerNumber, customerName
    FROM
        customers
    WHERE
        NOT EXISTS( SELECT 
                1
            FROM
                orders
            WHERE
                orders.customernumber = customers.customernumber);

### MySQL UPDATE EXISTS
假设你必须更新employees表中工作在San Francisco城市的人的的手机号，首先查找工作在San Franciso城市的人，你可以使用**EXISTS**操作，如下：
    
    SELECT 
        employeenumber, firstname, lastname, extension
    FROM
        employees
    WHERE
        EXISTS( SELECT 
                1
            FROM
                offices
            WHERE
                city = 'San Francisco'
                    AND offices.officeCode = employees.officeCode);
如果你想给工作在San Francisco的人的手机号添加数字5，你可以在update语句的where条件中使用**EXISTS**操作。如下：

    UPDATE employees 
    SET 
        extension = CONCAT(exention, '1')
    WHERE
        EXISTS( SELECT 
                1
            FROM
                offices
            WHERE
                city = 'San Francisco'
                    AND offices.officeCode = employees.officeCode);
### MySQL INSERT EXISTS
如果你想把没有用下订单的用户，存储在另外一张表中，你可以使用下面的步骤：

1. 创建一个和**customers**表相同结构的表
   
    CREATE TABLE customers_archive LIKE customers;
2. 向上面创建的customers_archive表中插入没有下单的用户
   
    INSERT INTO customers_archive
    SELECT * FROM customers
    WHERE NOT EXISTS( SELECT 
                1
            FROM
                orders
            WHERE
                orders.customernumber = customers.customernumber);
3. 查询customers_archive表来确认我们的操作

    SELECT * FROM customers_archive; 
### MySQL DELETE EXISTS
我们来看，删除customers表中没有下单的用户，操作如下：

    DELETE FROM customers
    WHERE
        EXISTS( SELECT 
           1
        FROM
            customers_archive a
    
        WHERE
            a.customernumber = customers.customerNumber);
### MySQL EXISTS vs. IN
查询用户至少下了一单的查询，你也可以使用**IN**操作。

    SELECT customerNumber, customerName
    FROM customers
    WHERE customerNumber IN (SELECT customerNumber FROM orders);
让我们来使用**EXPLAIN**语句来比较使用**IN**操作与**EXISTS**：

    EXPLAIN SELECT customerNumber, customerName
    FROM customers
    WHERE EXISTS( SELECT 1 FROM orders
        WHERE orders.customernumber = customers.customernumber); 

![EXISTS](http://www.mysqltutorial.org/wp-content/uploads/2016/01/MySQL-EXISTS-vs-IN-EXISTS-performance.jpg)

下面来看一个使用**IN**操作的性能：
    
    SELECT customerNumber, customerName
    FROM customers
    WHERE
        customerNumber IN (SELECT 
                customerNumber
            FROM
                orders);

![IN](http://www.mysqltutorial.org/wp-content/uploads/2016/01/MySQL-EXISTS-vs-IN-IN-performance.jpg)

从结果中可以看出查询使用EXISTS操作比使用IN操作要快的多。
这种结果的原因是:EXISTS操作的运行机制是，“查询最近的一个”原理，查找到最近的一个之后会返回true，然后结束查询。而带有子查询的IN操作，必须首先运行子查询，然后使用子查询的结果来运行父查询。通常的规律是：如果子查询包含的数据很大，使用**EXISTS**操作可以提高性能。当子查询中返回的数据很小，则使用**IN**操作可以提高性能。

另外：在子查询中使用 NULL 仍然返回结果集，这个例子在子查询中指定 NULL，并返回结果集，通过使用 EXISTS 仍取值为 TRUE。

    SELECT CategoryName
    FROM Categories
    WHERE EXISTS (SELECT NULL)
    ORDER BY CategoryName ASC
其实不要被这个EXISTS迷惑了。。你只需要关注**EXISTS**的返回值有没有数据集就好了，有数据集就是true，没有就是false
> 这里
  有一个有趣的问题：http://www.cnblogs.com/mytechblog/articles/2105785.html 
 
 ### IN和EXISTS的优化
 mysql中的in语句是把外表和内表作hash 连接，而exists语句是对外表作loop循环，每次loop循环再对内表进行查询。一直大家都认为exists比in语句的效率要高，这种说法其实是不准确的。这个是要区分环境的。

如果查询的两个表大小相当，那么用in和exists差别不大。
如果两个表中一个较小，一个是大表，则子查询表大的用exists，子查询表小的用in：
例如：表A（小表），表B（大表）

1：
select * from A where cc in (select cc from B) 效率低，用到了A表上cc列的索引；

select * from A where exists(select cc from B where cc=A.cc) 效率高，用到了B表上cc列的索引。
相反的

2：
select * from B where cc in (select cc from A) 效率高，用到了B表上cc列的索引；

select * from B where exists(select cc from A where cc=B.cc) 效率低，用到了A表上cc列的索引。

not in 和not exists如果查询语句使用了not in 那么内外表都进行全表扫描，没有用到索引；而not extsts 的子查询依然能用到表上的索引。所以无论那个表大，用not exists都比not in要快。
in 与 =的区别
select name from student where name in ('zhang','wang','li','zhao');
与
select name from student where name='zhang' or name='li' or name='wang' or name='zhao'
的结果是相同的。
in 前面 索引 exist 后面索引 用上索引快
