## 关于ObjectId的问题总结
如果你想快速得到答案，ObjectId到底是不是唯一的？经典答案：Yes & No

跟答案一样，每次听到这个答案的时候内心都是矛盾的。但是通常得到这个答案的时候也都有一段故事可讲。今天重点讲讲ObjectId那些事。

### ObjectId的构成
专业选手应该都学会先翻阅文档：[ObjectId](https://docs.mongodb.com/manual/reference/method/ObjectId/)
```
ObjectId = epoch时间(4字节) + 机器标识(3字节) + 进程号PID(2字节) + 计数器(3字节)
```

### 这样的构成从侧面反映了几个问题：

ObjectId总体上是递增的
排序的时候因为头4位是时间，时间是递增的，所以ObjectId总体保证递增的顺序。但不是绝对。因为epoch只精确到秒，在同一台机器同一秒内生成的ObjectId
还是会因为PID的不同，PID小的那个始终会排在PID大的那个前面，尽管PID大的ObjectId可能在这一秒内先生成。这通常无关紧要，不过如果真有什么我没注意到的场景，
还是留意这一点吧。也因为ObjectId的递增性，当你需要找到集合中最后一些文档的时候，放弃使用那些没有索引的时间字段吧，倒霉的时候整出一个COLLSCAN可能要了
你一个月的奖金也说不定。给你介绍一个新朋友: .sort({_id: -1})。如果是一个没有_id的[capped collection](https://docs.mongodb.com/manual/core/capped-collections/)呢？
你还有一个好朋友：.sort({$natural: -1})。

敲黑板：$natural在非capped collection中并不能代表插入顺序，特别是对于WT来说。

ObjectId在一秒内的数量是有限的
在时间、机器、进程都一定的情况下，最多能有多少个不重复的ObjectId呢？3个字节所能表达的最大的整数：2^24-1。
至少从目前机器的性能来看，要超过这个限制几乎是不太可能的，所以也没有必要担心。

ObjectId的唯一性
因为计数器的存在，无论如何ObjectId都应该是唯一的。所以答案才会有一半是：Yes。
所有的MongoDB driver都是根据同一份规范来编写的，这意味着不同语言的driver大部分行为应该是一样的，但在一些细节上面却根据语言的特点各有各的不同。
而这个计数器恰好就是这样一个细节。以常见的Java和C#驱动来说，Java实现使用了[AtomicInteger](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/atomic/AtomicInteger.html)，C#实现使用了[Interlocked.Increment](https://docs.microsoft.com/en-us/dotnet/api/system.threading.interlocked.increment?redirectedfrom=MSDN&view=netframework-4.7.2#System_Threading_Interlocked_Increment_System_Int32__)，
所以这二者都是保证真正的唯一的。

敲黑板：有同学说C#的计数器实现是随机数，大概是只看到了这一句。但这只是计数器的种子而已，不是计数器本身。审题要仔细啊……

Java和C#做这样的实现是因为正好有这样两个方便的类型实现了无锁的递增。这很大程度上依赖于语言本身的底层实现。并不是所有语言都提供了这样方便高效的实现，
根据这个[stackoverflow上的问题](https://stackoverflow.com/questions/4677237/possibility-of-duplicate-mongo-objectids-being-generated-in-two-different-colle)，
在某些版本的实现中使用了随机数。理论上使用这些版本的时候就会出现很小概率的重复ObjectId（1/(2^24-1)）。
所以，使用某些驱动的时候，答案可能是：No。
但是，（划重点）笔者检查了以下驱动的ObjectId实现：Java/C#/NodeJS/Ruby/Python，均使用的是真正的计数器。同时也求证过官方驱动团队，
近几年内的所有官方驱动均实现了计数器，没有使用随机数。所以除非你使用的是一个非常老的版本，或者很小众的某个驱动，应该都不需要为重复的ObjectId担心。

### Q&A
为什么选择ObjectId而不是递增ID？
参考segmentfault上面的问题：[mongoDB修改”_id”的objectID到普通递增id为什么不好](https://segmentfault.com/q/1010000006019599)
如何取到ObjectId里面的时间？
shell下可直接oid.getTimestamp()。各种驱动也都有对应的方法。
如何使用日期范围来查询ObjectId？
既然ObjectId是可以排序的，它当然也可以比较大小。在有日期范围的情况下，实际上可以从_id中利用IXSCAN找到相应的记录，而不需要根据另外一个时间字段来查询。如果时间字段正好没有索引的话，_id的优势就体现出来了。stackoverflow上详细讲了该怎么做。
使用自己生成的UUID字符串和ObjectId比较哪个做_id更好？
因为不知道自己生成的UUID算法，其实不太好比较。但可以确定的一点是，ObjectId是12个字节，而一般的UUID字符串都不止12个字节。从这个意义上来说ObjectId在索引和查询性能上是占优势的。即使同样是ObjectId，toString()之后也会变成24字节。所以没事不要随便toString()。
