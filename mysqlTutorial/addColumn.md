### 给MySQL表增加指定位置的列
给表添加列是一个常用的操作，

MySQL增加列的时候可以指定此列的位置

给指定位置加列需要两个关键字: FIRST 和 AFTER

FIRST 表示增加此列为第一个列

AFTER表示增加在某个列之后

注意MySQL增加列指定位置时没有BEFORE的用法，

第一列可以使用FIRST，非第一列使用AFTER。
```
语法：ALTER TABLE table_name ADD [COLUMN] col_name column_definition  [ FIRST | AFTER col_name]
```
实例：
```
DROP TABLE IF EXISTS `test`;  
  
CREATE TABLE `test` (  
  `a` int(11) NOT NULL,  
  `b` varchar(200) NOT NULL  
) ENGINE=InnoDB DEFAULT CHARSET=utf8;  
```
在test表a列后面增加一列c:
```
ALTER TABLE test ADD COLUMN c INT NOT NULL AFTER a  
```
在test表的第一列增加字段id：
```
ALTER TABLE test ADD COLUMN id INT UNSIGNED NOT NULL auto_increment PRIMARY KEY FIRST  
```
