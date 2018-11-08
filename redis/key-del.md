### 批量删除key
由于测试项目上线，需要删除redis所有的key来开始新测试。发现del命令只能一个一个的删除，那不成我又要写bash脚本?!!

1. 删除所有Key

删除所有Key，可以使用Redis的flushdb和flushall命令

//删除当前数据库中的所有Key

flushdb
//删除所有数据库中的key

flushall
注：keys 指令可以进行模糊匹配，但如果 Key 含空格，就匹配不到了，暂时还没发现好的解决办法。

2. 批量删除Key

Redis 中有删除单个 Key 的指令 DEL，但好像没有批量删除 Key 的指令，不过我们可以借助 Linux 的 xargs 指令来完成这个动作 :

redis-cli keys "*" | xargs redis-cli del
//如果redis-cli没有设置成系统变量，需要指定redis-cli的完整路径

//如：/opt/redis/redis-clikeys"*"|xargs/opt/redis/redis-clidel

3. 如果要指定 Redis 数据库访问密码，使用下面的命令

redis-cli -a password keys "*" | xargs redis-cli -a password del
4. 如果要访问 Redis 中特定的数据库，使用下面的命令 

//下面的命令指定数据序号为0，即默认数据库

redis-cli -n 0 keys"*" | xargs redis-cli -n 0 del
