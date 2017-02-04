## CASE Syntax
语法如下：
    
    CASE case_value
    WHEN when_value THEN statement_list
    [WHEN when_value THEN statement_list] ...
    [ELSE statement_list]
    END CASE
 
 或者是
 
    CASE
    WHEN search_condition THEN statement_list
    [WHEN search_condition THEN statement_list] ...
    [ELSE statement_list]
    END CASE
 
上面存储过程中使用的case语句，实现了混合条件结构，对于第一个表达式中出现的**case_value**，他是一个表达式，是用来和WHEN子句中的**when_value**表达式作比较直到这两个表达式的值相等。
如果一个相等的when_value值被找到，则运行THEN后面的**statement_list**，如果没有找到相等的**when_value**，则运行ELSE后面的**statement_list**。
这个表达式不能够被用来判断NULL相等，因为**NULL=NULL**结果是false。

对于第二种语法，WHEN子句的每个search_condition进行求值直到其中一个结果是true，然后运行CASE子句中的**statement_list**。如果没有true的结果，
当ELSE存在的情况下运行**statement_list**。

在case的条件下如果没有**when_value**或者是**search_condition**匹配且不存在ELSE子句的情况下，a Case not found for CASE statement error results
Each statement_list consists of one or more SQL statements; an empty statement_list is not permitted.
To handle situations where no value is matched by any WHEN clause, use an ELSE containing an empty BEGIN ... END block, as shown in this example.
(The indentation used here in the ELSE clause is for purposes of clarity only, and is not otherwise significant.)

    DELIMITER |

    CREATE PROCEDURE p()
      BEGIN
        DECLARE v INT DEFAULT 1;

        CASE v
          WHEN 2 THEN SELECT v;
          WHEN 3 THEN SELECT 0;
          ELSE
            BEGIN
            END;
        END CASE;
      END;
      |

## IF Syntax

    IF search_condition THEN statement_list
        [ELSEIF search_condition THEN statement_list] ...
        [ELSE statement_list]
    END IF
举例如下：demo1

    DELIMITER //

    CREATE FUNCTION SimpleCompare(n INT, m INT)
      RETURNS VARCHAR(20)

      BEGIN
        DECLARE s VARCHAR(20);

        IF n > m THEN SET s = '>';
        ELSEIF n = m THEN SET s = '=';
        ELSE SET s = '<';
        END IF;

        SET s = CONCAT(n, ' ', s, ' ', m);

        RETURN s;
      END //

    DELIMITER ;
举例如下：demo2

    DELIMITER //

    CREATE FUNCTION VerboseCompare (n INT, m INT)
      RETURNS VARCHAR(50)

      BEGIN
        DECLARE s VARCHAR(50);

        IF n = m THEN SET s = 'equals';
        ELSE
          IF n > m THEN SET s = 'greater';
          ELSE SET s = 'less';
          END IF;

          SET s = CONCAT('is ', s, ' than');
        END IF;

        SET s = CONCAT(n, ' ', s, ' ', m, '.');

        RETURN s;
      END //

    DELIMITER ;
##  WHILE Syntax

    [begin_label:] WHILE search_condition DO
        statement_list
    END WHILE [end_label]
举例如下：demo
    CREATE PROCEDURE dowhile()
    BEGIN
      DECLARE v1 INT DEFAULT 5;

      WHILE v1 > 0 DO
        ...
        SET v1 = v1 - 1;
      END WHILE;
    END;
## ITERATE Syntax
## LEAVE Syntax
## LOOP Syntax
语法如下：
    [begin_label:] LOOP
        statement_list
    END LOOP [end_label]
举例如下：demo

   CREATE PROCEDURE doiterate(p1 INT)
    BEGIN
      label1: LOOP
        SET p1 = p1 + 1;
        IF p1 < 10 THEN
          ITERATE label1;
        END IF;
        LEAVE label1;
      END LOOP label1;
      SET @x = p1;
    END;
## REPEAT Syntax
## RETURN Syntax
