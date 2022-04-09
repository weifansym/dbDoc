## redis实现排序，搜索功能
最近项目需要实现在线用户功能，而且在线用户支持按照字母顺序排序。而且需要支持模糊搜索的功能，下面说一下设计思路。

1. 在线用户按照字母顺序，这里想到使用redis的zset,因为zset默认对元素mumber 在score值相同的情况下按照字母的字典顺序排序，因此使用这个是比较好的。
2. 上面虽然可以吧昵称最为元素mumber, score相同，但是无法针对昵称获取用户ID，所有这里有进行了重新设计，即元素mumber,可以是nick+特殊字符+uid进行拼接形成
3.一切都看上去这么完美，但是在按照昵称进行模糊搜索的时候有了问题了。所哟查找资料看到zset中有一个zscan命令支持match,可以编写简单的匹配模式。所以看上去问题也可以解决。
4. 在处理match的返回结果的时候有出现了问题，因为前面mumber里面带有uid和特殊字符，所以好像行不通了。因为不可能吧昵称也搜索进来吧。
这里产生了两种解决方案：
1: 昵称单独使用zset的member, uid使用score，但是按照score排序会导致不满足需求了。所以在想能不能找到一个昵称映射为某个自增的code，然后拼接上uid应该可行。
但是通过寻找没找到太好的解决方案。
2: 通过应用程序中来处理match后结果的返回值，过滤掉查询出来的包含uid信息的记录。而且matchpp匹配的结果也是先显示昵称匹配的，后面在显示uid匹配的。
看上去第二种是满足方案的。
<img width="517" alt="截屏2022-04-09 下午5 05 43" src="https://user-images.githubusercontent.com/6757408/162564806-b8068968-b835-4762-a5f7-3c52037a8cfe.png">
```

new-cloud-test:4>zadd page_rank 1 中古了  1 你看呢
ERR syntax error

new-cloud-test:4>zadd page_rank 1 中古了  1 你看呢
ERR syntax error

new-cloud-test:4>zadd page_rank 1 1111
1

new-cloud-test:4>zadd page_rank 1 中国呢
1

new-cloud-test:4>zadd page_rank 1 中国呢  1 看到了吗
1

new-cloud-test:4>zadd page_rank 1 估计不知道 1 藏族自治州
2

new-cloud-test:4>zscan page_rank 0 match *知道* count 20
1) 0
2) 估计不知道
1
new-cloud-test:4>zadd page_rank 1 aa中国呢  1 ab看到了吗
2

new-cloud-test:4>zscan page_rank 0 match *看* count 20
1) 0
2) ab看到了吗
1
看到了吗
1
new-cloud-test:4>zscan page_rank 0 match *12* count 20
1) 0
2) aaaa=>=>123456
1
google=>=>123456
1
huhhhu=>=>123456
1
new-cloud-test:4>zadd page_rank 1 1234-huhu  1 123达到户户
2

new-cloud-test:4>zscan page_rank 0 match *123* count 20
1) 0
2) 1234-huhu
1
123达到户户
1
aaaa=>=>123456
1
google=>=>123456
1
huhhhu=>=>123456
1
new-cloud-test:4>


```
