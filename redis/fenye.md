## 基于redis做缓存分页

在实际业务中我们会将一些热数据缓存到redis里面，这时候数据量比较大的话，我们就要对这些热数据进行分页，分页的方式有2种：

第一：从redis拿出所有数据后，再做内存分页（不推荐），热点数据小的时候可以这样做，性能相差不是很大，但是当数据量大的时候，分页期间就会占用大量内存，或撑爆；

第二：基于redis的数据结构做缓存分页，这里又分2种

①：基于redis的list数据结构，直接通过list的数据结构，用range方法可以进行分页，在数据量大的时候，性能也很可观，但是当存在接口高并发访问时，这个list可能会无限延长，且里面的数据会存在很多重复，这就会影响到正常的业务（不是很推荐）；

②：基于redis的ZSet数据结构，通过Zset这个有序集合我们也可以做分页，同样也是用range方法，但是这里比较麻烦的是在初始化数据的时候Zset必须存放TypedTuple类型的数据，这个类型是一个value和score的键值对，具体可以查百度，这个score的生成比较麻烦我这边测试时用的是当前数据在这个list的位置，然后Zset是根据这个score值来排序的，默认是从小到大；用这个的好处是，即使在高并发情况下Zset中也不会存在重复数据从而影响正常的业务；而且分页效率也和list结构差不多；

③：用hash和Zset来一起实现；Zset中存储有序的id字段，通过分页后拿到id，然后再用id去hash中取，感觉应该效率相差不大的，只是中间多了层从hash结构取，还需要维护又一个hash；

参考：
* http://blog.huangz.me/2019/redis-paging.html
* http://blog.huangz.me/index.html
* https://www.cnblogs.com/duhuo/p/5567438.html
