## 12.3 Date and Time Types
* 12.3.1 [The DATE, DATETIME, and TIMESTAMP Types](https://dev.mysql.com/doc/refman/5.7/en/datetime.html)
* 12.3.2 The TIME Type
* 12.3.3 The YEAR Type
* 12.3.4 YEAR(2) Limitations and Migrating to YEAR(4)
* 12.3.5 [Automatic Initialization and Updating for TIMESTAMP and DATETIME](https://dev.mysql.com/doc/refman/5.7/en/timestamp-initialization.html)
* 12.3.6 Fractional Seconds in Time Values
* 12.3.7 Conversion Between Date and Time Types
* 12.3.8 Two-Digit Years in Dates

## Date and Time Types
代表日期与时间的值是： [DATE](https://dev.mysql.com/doc/refman/5.7/en/datetime.html), [TIME](https://dev.mysql.com/doc/refman/5.7/en/time.html), [DATETIME](https://dev.mysql.com/doc/refman/5.7/en/datetime.html), [TIMESTAMP](https://dev.mysql.com/doc/refman/5.7/en/datetime.html), 和 [YEAR](https://dev.mysql.com/doc/refman/5.7/en/year.html)，其中每一个时间类型都有一个有效值范围，就行**0**这个值，有可能被用来指定一个mysql不能表示的无效值。这个**TIMESTAMP**类型还具有自动更新的功能，接下来将会详述。

牢记这些注意事项在使用日期和时间类型的时候：

* mysql在根据给定的日期或者是时间检索数据的时候是一种标准的输出格式，但是它会试着解释你输入的各种日期和时间格式。可以通过[Date and Time Literals](https://dev.mysql.com/doc/refman/5.7/en/date-and-time-literals.html)来了解具体允许的日期或者是时间格式。当你提供了其他格式的时候有可能会得不到预期的结果
* 尽管mysql试着去解释多种形式的日期或时间，但是日期部分必须是一直给定的**年-月-日**的顺序（例如，'98-09-04'），不能是**month-day-year或者是day-month-year**的顺序
* 最好不要使用两个数字代表日期中的年，因为mysql不知道当前的日期所处的时间
* 从一种时间类型转化为另一种时间类型注意转换的规则[Conversion Between Date and Time Types](https://dev.mysql.com/doc/refman/5.7/en/date-and-time-type-conversion.html)
* 如果一个值在上下文中是数字，mysql会把一个日期或者是时间值自动转换为数字。
* mysql在遇到一个值超过了日期或时间类型，会在这个类型上转化这个值为**0**，例外的是，超出范围的时间类型被裁剪到时间范围的适当端点。
* 通过设置**SQL mode**为一个适当的值，你可以指定mysql支持的时间类型的精确值。通过设置**ALLOW_INVALID_DATES**这个SQL mode,mysql可以接受已经确定的日,例如“2009-11-31”。这些非常有用当你在将来的处理中指定了一个**possibly wrong**值。在这个mode下，mysql仅验证月份在1到12的范围内，并且该日处于从1到31的范围内。
* mysql允许你存储日期，在DATE类型列中天为0，在DATETIME类型列中月和天为0.在程序中当你不知道你生日的确切日期的时候非常有用。在这种情况下你存储日期像'2009-00-00' 或者是 '2009-01-00'这样。如果你存储的日期是上面的形式，那么在使用** DATE_SUB() or DATE_ADD()**这些需要正确日期的方法中不会得到预期的值，避免月和日上为0的值可以使用**NO_ZERO_IN_DATE**mode。
* mysql允许你存储0值为**0000-00-00**作为一个**dummy date**，在一些情况下比使用NULL值更方便，使用更少的数据以及索引空间。不允许使用0000-00-00可以指定 **NO_ZERO_DATE** mode
* “Zero” date or time values used through Connector/ODBC are converted automatically to NULL because ODBC cannot handle such values.
