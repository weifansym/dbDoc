## Windows下Redis搭建

redis在Linux环境下配置很简单，需要下载安装就好了。在windows,由于没有官网的支持，所以安装有点麻烦，但是由于Windows开发团队的支持，现在在windows上也能很好的运用。
### 下载地址
1. Redis官网下载页面: http://redis.io/download

2. Windows下Redis项目: https://github.com/MSOpenTech/redis
3. 在releases页面找到并下载最新的ZIP包: https://github.com/MSOpenTech/redis/releases

在releases页面下载最新的redis，在这个页面我们既可以选择**msi**文件，也可以选择**zip** 文件。或者是选择源代码文件来自己编译。
这里我们选择**zip**文件。下载**Redis-x64-2.8.2400.zip**文件到本地，然后解压，我这里解压到 **D:\DevlopPrograms\Redis-x64**里。

简单测试,则使用 redis-cli.exe 即可, 打开后会自动连接上本机服务器. 可以输入 info 查看服务器信息。

如果要进行基准测试,可以启动服务器后,在cmd中运行 redis-benchmark.exe 程序。
### 启动与注册服务

1.  直接运行redis-server.exe文件进行启动 
解压到后运行"Redis-x64"文件夹下的redis-server.exe即可，但是这样运行会出现一个如下警告提示：


> Warning: no config file specified,using the default config. In order to specify a config file use ‘redis-server /path/to/redis.conf’

提示也比较明显，没有明确的配置文件，使用的是默认配置，请使用‘redis-server /path/to/redis.conf’指定明确的配置文件。这里由于Redis-x64文件下有了redis-windows.conf我们就可以忽略这个警告提示。这样我们的redis服务就算运行起来了。

2.  通过注册windows服务进行启动 
如果准备长期使用，则需要注册为系统服务。进入CMD，切换目录：

    d:
    cd D:\DevlopPrograms\Redis-x64

注册服务,可以保存为**service-install.bat**文件:

    redis-server.exe --service-install redis.windows.conf --loglevel verbose
    redis-server --service-start
卸载服务，可以保存为**uninstall-service.bat**文件：

    redis-server --service-stop
    redis-server --service-uninstall
可以在注册服务时，通过**–service-name redisService1** 参数直接指定服务名，适合安装多个实例的情况，卸载也是同样的道理。

> 具体的注册服务参看Windows Service Documentation 这个文档

### 修改配置文件
修改配置文件**redis.windows.conf**，如果有中文，请另存为UTF-8编码。

    // 修改端口号
    // port 6379
    port 80

    // 指定访问密码
    // requirepass foobared
    // requirepass 6EhSiGpsmSMRyZieglUImkTr-eoNRNBgRk397mVyu66MHYuZDsepCeZ8A-MHdLBQwQQVQiHBufZbPa

    // 设置最大堆内存限制,两者设置一个即可
    // maxheap <bytes>
    maxheap 512000000

    // 设置最大内存限制, 两者设置一个即可
    // maxmemory <bytes>
    maxmemory 512000000
此时，如果用客户端来访问，使用如下cmd命令，可以保存为 client.bat 文件：

    redis-cli.exe -h redis.duapp.com -p 80 -a 6EhSiGpsmSMRyZieglUImkTr-eoNRNBgRk397mVyu66MHYuZDsepCeZ8A-MHdLBQwQQVQiHBufZbPa








