## MYSQL基础笔记之group by
group by语法可以根据给定数据列的每个成员对查询结果进行分组统计，最终得到一个分组汇总表。
SELECT子句中的列名必须为分组列或列函数。列函数对于GROUP BY子句定义的每个组各返回一个结果。
某个员工信息表结构和数据如下：
```
id  name  dept  salary  edlevel  hiredate 
      1 张三 开发部 2000 3 2009-10-11
      2 李四 开发部 2500 3 2009-10-01
      3 王五 设计部 2600 5 2010-10-02
      4 王六 设计部 2300 4 2010-10-03
      5 马七 设计部 2100 4 2010-10-06
      6 赵八 销售部 3000 5 2010-10-05
      7 钱九 销售部 3100 7 2010-10-07
      8 孙十 销售部 3500 7 2010-10-06 
```
例如，我想列出每个部门最高薪水的结果，sql语句如下：
```
SELECT DEPT, MAX(SALARY) AS MAXIMUM
FROM STAFF
GROUP BY DEPT
```
查询结果如下：
```
      DEPT  MAXIMUM 
      开发部 2500
      设计部 2600
      销售部 3500
```
1、满足“SELECT子句中的列名必须为分组列或列函数”，因为SELECT有GROUP BY DEPT中包含的列DEPT。
2、“列函数对于GROUP BY子句定义的每个组各返回一个结果”，根据部门分组，对每个部门返回一个结果，就是每个部门的最高薪水。
注意：计算的是每个部门（由 GROUP BY 子句定义的组）而不是整个公司的 MAX(SALARY)。
例如，查询每个部门的总的薪水数
```
SELECT DEPT, sum( SALARY ) AS total
FROM STAFF
GROUP BY DEPT
```
查询结果如下：
```
DEPT  total 
开发部 4500
设计部 7000
销售部 9600
```
将 WHERE 子句与 GROUP BY 子句一起使用
分组查询可以在形成组和计算列函数之前通过WHERE子句过滤部分列。必须在GROUP BY 子句之前指定 WHERE 子句。
例如，查询公司2010年入职的各个部门每个级别里的最高薪水
```
SELECT DEPT, EDLEVEL, MAX( SALARY ) AS MAXIMUM
FROM staff
WHERE HIREDATE > '2010-01-01'
GROUP BY DEPT, EDLEVEL
ORDER BY DEPT, EDLEVEL
```
查询结果如下：
````
  DEPT  EDLEVEL  MAXIMUM 
      设计部 4 2300
      设计部 5 2600
      销售部 5 3000
      销售部 7 3500
```      
注意：在SELECT语句中指定的每个列名也在GROUP BY子句中提到。未在这两个地方提到的列名将产生错误。
GROUP BY子句对DEPT和EDLEVEL的每个唯一组合各返回一行。

在GROUP BY子句之后使用HAVING子句
可应用限定条件进行分组，以便系统仅对满足条件的组返回结果。为此，在GROUP BY子句后面包含一个HAVING子句。HAVING子句可包含一个或多个用AND和OR连接的谓词。每个谓词将组特性（如AVG(SALARY)）与下列之一进行比较：
例如：寻找雇员数超过2个的部门的最高和最低薪水：
```
SELECT DEPT, MAX( SALARY ) AS MAXIMUM, MIN( SALARY ) AS MINIMUM
FROM staff
GROUP BY DEPT
HAVING COUNT( * ) >2
ORDER BY DEPT
```
查询结果如下：
```
  DEPT  MAXIMUM  MINIMUM 
      设计部 2600 2100
      销售部 3500 3000
 ```     
例如：寻找雇员平均工资大于3000的部门的最高和最低薪水：
```
SELECT DEPT, MAX( SALARY ) AS MAXIMUM, MIN( SALARY ) AS MINIMUM
FROM staff
GROUP BY DEPT
HAVING AVG( SALARY ) >3000
ORDER BY DEPT
```
查询结果如下：
```
  DEPT  MAXIMUM  MINIMUM 
      销售部 3500 3000
```      
