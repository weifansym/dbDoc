## EXPLAIN Output Format
[EXPLAIN Output Format](https://dev.mysql.com/doc/refman/5.6/en/explain-output.html)

这个rows在官网的文档中有解释：
http://dev.mysql.com/doc/refman/5.7/en/explain-output.html#explain_rows

The rows column indicates the number of rows MySQL believes it must examine to execute the query.

这个rows就是mysql认为必须要逐行去检查和判断的记录的条数。
举个例子来说，假如有一个语句 select * from t where column_a = 1 and column_b = 2;
全表假设有100条记录，column_a字段有索引（非联合索引），column_b没有索引。
column_a = 1 的记录有20条， column_a = 1 and column_b = 2 的记录有5条。

那么最终查询结果应该显示5条记录。 explain结果中的rows应该是20. 因为这20条记录mysql引擎必须逐行检查是否满足where条件。
