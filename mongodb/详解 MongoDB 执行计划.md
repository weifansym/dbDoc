## 详解 MongoDB 执行计划
### 引言
在 RDBMS (Relational Database Management System) 中，无论哪种数据库，都提供了 SQL 剖析工具，用来解决 SQL 效率低下的问题。在 MongoDB 中，也有相应的策略来实现剖析。
MongoDB 提供了 **db.collection.explain ()、cursor.explain ()** 方法和 explain 命令返回查询计划信息和查询计划的执行统计信息。

![image](https://user-images.githubusercontent.com/6757408/157079399-4c7cf8cc-c398-411b-a928-61abec144517.png)

### db.collection.explain () 简介
#### 支持的操作
```
aggregate(); count(); distinct(); find(); group(); remove(); update() 

cursor.explain(verbosity) 为一个游标返回其查询执行计划(Reports on the query execution plan for a cursor)
cursor.explain(verbosity) 最通常的行式为db.collection.find().explain()。其中verbosity说明返回信息的粒度。
```
explain () 写操作 (remove 和 update) 时，返回是删除和更新操作的信息，并不将修改应用至数据库。

通过 db.collection.explain().help() 可以获取支持的操作
```
> db.collection.explain().help()
Explainable operations
	.aggregate(...) - explain an aggregation operation
	.count(...) - explain a count operation
	.distinct(...) - explain a distinct operation
	.find(...) - get an explainable query
	.findAndModify(...) - explain a findAndModify operation
	.group(...) - explain a group operation
	.remove(...) - explain a remove operation
	.update(...) - explain an update operation
Explainable collection methods
	.getCollection()
	.getVerbosity()
	.setVerbosity(verbosity)
```
#### 执行模式
db.collection.find().explain(verbose)
* explain (）输出一个以文档形式展现的执行计划，可以包括统计信息 (可选)。
* verbose：可选参数。缺省值为 queryPlanner，用于查看指定执行计划的特定部分。即给定不同的参数则输出信息的详细程度不同。常用的有 queryPlanner、executionStats、allPlansExecution。

**queryPlanner**
缺省模式。MongoDB 运行查询优化器对当前的查询进行评估并选择一个最佳的查询计划。

**executionStats**
MongoDB 运行查询优化器对当前的查询进行评估并选择一个最佳的查询计划进行执行。在执行完毕后返回这个最佳执行计划执行完成时的相关统计信息。对于写操作 db.collection.explain ()
返回关于更新和删除操作的信息，但是并不将修改应用到数据库。对于那些被拒绝的执行计划 (rejectedPlans)，不返回其统计信息。

**allPlansExecution**
该模式是前 2 种模式的更细化，即会包括上述 2 种模式的所有信息。
即按照最佳的执行计划执行以及列出统计信息，而且还会列出一些候选的执行计划。
如果有多个查询计划，executionStats 信息包括这些执行计划的部分统计信息。

#### 相关用法
先在集合中插入一条数据
```
> db.student.insert({"age" : 90.0,"name" : "rainbowhorse","score" : 90.0,"sex" : "M"});
WriteResult({ "nInserted" : 1 })
```
##### 演示 db.collection.explain ().update ()
```
> db.student.explain("allPlansExecution").update({"name":"rainbowhorse"},{$set:{"score":99}});
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "TEST.student",
		"indexFilterSet" : false,
		"parsedQuery" : {
			"name" : {
				"$eq" : "rainbowhorse"
			}
		},
		"winningPlan" : {
			"stage" : "UPDATE",
			"inputStage" : {
				"stage" : "COLLSCAN",
				"filter" : {
					"name" : {
						"$eq" : "rainbowhorse"
					}
				},
				"direction" : "forward"
			}
		},
		"rejectedPlans" : [ ]
	},
	"executionStats" : {
		"executionSuccess" : true,
		"nReturned" : 0,
		"executionTimeMillis" : 0,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 11,
		"executionStages" : {
			"stage" : "UPDATE",
			"nReturned" : 0,
			"executionTimeMillisEstimate" : 0,
			"works" : 13,
			"advanced" : 0,
			"needTime" : 12,
			"needYield" : 0,
			"saveState" : 0,
			"restoreState" : 0,
			"isEOF" : 1,
			"invalidates" : 0,
			"nMatched" : 1,
			"nWouldModify" : 1,
			"nInvalidateSkips" : 0,
			"wouldInsert" : false,
			"fastmodinsert" : false,
			"inputStage" : {
				"stage" : "COLLSCAN",
				"filter" : {
					"name" : {
						"$eq" : "rainbowhorse"
					}
				},
				"nReturned" : 1,
				"executionTimeMillisEstimate" : 0,
				"works" : 12,
				"advanced" : 1,
				"needTime" : 11,
				"needYield" : 0,
				"saveState" : 1,
				"restoreState" : 1,
				"isEOF" : 0,
				"invalidates" : 0,
				"direction" : "forward",
				"docsExamined" : 11
			}
		},
		"allPlansExecution" : [ ]
	},
	"serverInfo" : {
		"host" : "rainbowhorse",
		"port" : 27017,
		"version" : "4.0.3",
		"gitVersion" : "7ea530946fa7880364d88c8d8b6026bbc9ffa48c"
	},
	"ok" : 1
}
```
再次查看文档，文档并没有被更新。正如前文所述，该方式并不将修改应用到数据库。
```
> db.student.find({"name":"rainbowhorse"});
{ "_id" : ObjectId("5cbbd841525ed310c440610a"), "age" : 90, "name" : "rainbowhorse", "score" : 90, "sex" : "M" }
```
注意：将 explain () 放置到 update () 之后则会提示错误。
```
> db.student.update({"name":"rainbowhorse"},{$set:{"score":99}}).explain("allPlansExecution");
2019-04-21T10:53:40.824+0800 E QUERY    [js] TypeError: db.student.update(...).explain is not a function :
@(shell):1:1
```
在执行计划中，部分操作符需要放至 explain() 之前，部分需要放到 explain() 之后才能正确执行。

聚合查询中使用：collection.explain().aggregate(...)

#### 执行计划相关描述
缺省情况下，explain 包括 2 个部分，queryPlanner 和 serverInfo。如果使用了 executionStats 或者 allPlansExecution，则还会返回 executionStats 信息。
```
> db.student.find({"name":"rainbowhorse"}).explain("allPlansExecution");
{
	"queryPlanner" : {
		"plannerVersion" : 1,		//查询计划版本
		"namespace" : "TEST.student",		//被查询对象
		"indexFilterSet" : false,		//是否使用到了索引过滤
		"parsedQuery" : {			//解析查询，即过滤条件是什么
			"name" : {		//此处为name=rainbowhorse
				"$eq" : "rainbowhorse"
			}
		},
		"winningPlan" : {		//最佳的执行计划
			"stage" : "COLLSCAN",		//COLLSCAN为集合扫描
			"filter" : {		//过滤条件
				"name" : {
					"$eq" : "rainbowhorse"
				}
			},
			"direction" : "forward"		//方向：forward
		},
		"rejectedPlans" : [ ]		//拒绝的执行计划，此处没有
	},
	"executionStats" : {		//执行计划相关统计信息
		"executionSuccess" : true,		//执行成功的状态
		"nReturned" : 1,		//返回结果集数目
		"executionTimeMillis" : 0,		//执行所需的时间,毫秒
		"totalKeysExamined" : 0,		//索引检查的时间
		"totalDocsExamined" : 11,		//检查文档总数
		"executionStages" : {
			"stage" : "COLLSCAN",		//使用集合扫描方式
			"filter" : {		//过滤条件
				"name" : {
					"$eq" : "rainbowhorse"
				}
			},
			"nReturned" : 1,		//返回结果集数目
			"executionTimeMillisEstimate" : 0,		//预估的执行时间，毫秒
			"works" : 13,		//工作单元数，一个查询会被派生为一些小的工作单元
			"advanced" : 1,		//优先返回的结果数目
			"needTime" : 11,
			"needYield" : 0,
			"saveState" : 0,
			"restoreState" : 0,
			"isEOF" : 1,
			"invalidates" : 0,
			"direction" : "forward",
			"docsExamined" : 11		//文档检查数目
		},
		"allPlansExecution" : [ ]
	},
	"serverInfo" : {		//服务器信息，包括主机名，端口，版本等。
		"host" : "rainbowhorse",
		"port" : 27017,
		"version" : "4.0.3",
		"gitVersion" : "7ea530946fa7880364d88c8d8b6026bbc9ffa48c"
	},
	"ok" : 1
}
```
更详细的描述可以参考官方文档：https://docs.mongodb.com/manual/reference/explain-results/#executionstats
#### Stage 状态分析
<img width="799" alt="截屏2022-03-08 上午12 55 36" src="https://user-images.githubusercontent.com/6757408/157080801-cb8ee78a-7245-429b-b5d5-42565565d779.png">

#### 比较运算符
```
$eq    =               "="
$gt   (greater than )  >
$gte                   >=  (equal)
$lt   (less than)      <
$lte                   <=  (equal)
$ne   (not equal)      !=
$in                    in
$nin  (not in)         !in

重点：所有的比较运算符都是出现在键与值得中间，示例如下
{ <field_name>: { $operator: <value> } }
{ <ename>: { $eq: "robin" } }
{ <qty>: { $gt: 20 } }
```
### 参考
* MongoDB 执行计划获取 (db.collection.explain ())
* https://docs.mongodb.com/manual/reference/explain-results/#executionstats

转自：http://rainbowhorse.site/%E8%AF%A6%E8%A7%A3MongoDB%E6%89%A7%E8%A1%8C%E8%AE%A1%E5%88%92/#%E6%AF%94%E8%BE%83%E8%BF%90%E7%AE%97%E7%AC%A6
