## MYSQL DISTINCT
在本章中你会学到在**select**查询中怎么使用**DISTINCT**子句来排除重复数据
### DISTINCT介绍
在使用select做查询的时候，通常我们会获取到重复行的数据，为了删除重复的行，我们可以使用DISTINCT子句来处理

下面是使用DISTINCT子句的语法

    SELECT DISTINCT
        columns
    FROM
        table_name
    WHERE
        where_conditions;
### MySQL DISTINCT example
让我们来看一个使用DISTINCT简单的例子：在员工表中查找唯一的**last names**。

    SELECT 
        lastname
    FROM
        employees
    ORDER BY lastname;
你会看到结果中会出现相同的last name。

在上面的查询语句中使用DISTINCT你会看到重复的last name已经被删除了，只留下唯一的一个值。

    SELECT DISTINCT
        lastname
    FROM
        employees
    ORDER BY lastname;  
### MySQL DISTINCT and NULL values
 
如果你的数据行中有NULL值，你也可以使用DISTINCT，mysql查询结果中会保留一条NULL值（删除其他NULL的行），因为mysql认为所有为NULL的值都相同。

例如在**customers**表中，我们有一个字段state具有NULL值，当我们使用DISTINCT取查询state这列的时候。，你会看到唯一的state值和一个NULL值。    
   
    SELECT DISTINCT
        state
    FROM
        customers; 
### MySQL DISTINCT with multiple columns
你也可以使用DISTINCT在多个列中，在这个例子中，mysql使用组合的多列，来在查询结果中获取唯一的值。例如，在customers表中获取唯一的组合（city和state）值。

    SELECT DISTINCT
        state, city
    FROM
        customers
    WHERE
        state IS NOT NULL
    ORDER BY state , city;
### DISTINCT clause 和 GROUP BY clause
如果在使用GROUP BY子句不带聚合函数的情况下，GROUP BY子句的行为很像DISTINCT子句。下面的例子是使用GROUP BY子句来在**customers**表中查询唯一的state值。

    SELECT 
        state
    FROM
        customers
    GROUP BY state;
看看结果和使用DISTINCT一样。
通常认为，DISTINCT是一种特殊的GROUP BY子句。不同之处是GROUP BY子句是用来分类排序结果集，而DISTINCT却不是。
如果在使用DISTINCT查询中使用ORDER BY其结果和使用GROUP BY相同。
    
    SELECT DISTINCT
        state
    FROM
        customers
    ORDER BY state;
### DISTINCT and aggregate function
你可以使用带有聚合函数的DISTINCT子句，例如SUM，AVG，COUNT等，用来在mysql使用聚合函数返回结果集之前来删除重复的行。
例如，从customers中查询唯一的states（州）的数量。

    SELECT 
        COUNT(DISTINCT state)
    FROM
        customers
    WHERE
        country = 'USA';
### MySQL DISTINCT with LIMIT clause
你也可以使用DISTINCT子句和LIMIT子句。 当mysql查询到limit中指定数量的唯一结果之后就会停止查询。

    SELECT DISTINCT
        state
    FROM
        customers
    WHERE
        state IS NOT NULL
    LIMIT 5;
上面在customers表中用来查询首先出现的5个不为空的唯一的state（州）值。
    
     
