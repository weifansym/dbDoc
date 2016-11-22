##Linux环境：Ubuntu 14.04 32-bit 和 Centos6.8 64-bit

Mysql版本：Mysql 5.1.7

 

###一、首先看看ubuntu 下的mysql安装

比较简单，就是一条命令，其余的就是配置的问题了

1、查看是否已经安装过
 
     mysql #ps -ef |grep mysql
如果出现例如：mysql 7111 1 0 23:02 ? 00:00:00 /usr/sbin/mysqld 则表示已经安装过，需要先卸载再安装
2、开始安装，执行：

    apt-get install mysql-server mysql-client 
运行结果如下所示:

┌─────────────────────────────────────────┤ Configuring mysql-server-5.5 ├─────────────────────────────────────────┐
│ While not mandatory, it is highly recommended that you set a password for the MySQL administrative "root" user. │
│ │
│ If this field is left blank, the password will not be changed. │
│ │
│ New password for the MySQL "root" user: │
│ │
│ *****___________________________________________________________________________________________________________ │
│ │
│ <Ok> │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

输入数据库root密码
3、测试是否安装成功

    ps -ef |grep mysql 或者 netstat -tap |grep mysql
出现进程或者端口有监听就表示安装成功

4、启动和停止mysql服务：

    stop mysql
    start mysql
5、设置开机自启动：

    vi /etc/rc.local
     #加入下面的命令
    /etc/init.d/mysql start
6、远程链接mysql服务：

如果出现access denied xxxx (user password yes) 之类的错误，登录mysql服务器

    grant all on mysql.* to 'root'@'%' identified by 'admin' with grant option;

    从所有主机：
    grant all privileges on *.* to root@"%" identified by "passw0rd" with grant option;

    从指定主机：
    grant all privileges on *.* to root@"192.168.11.205" identified by "passw0rd" with grant option;
至此，mysql安装完毕。。。

其他：

MySQL安装后的目录结构分析(此结构只针对于使用apt-get install 在线安装情况)：
### 二、Centos6.8 下的mysql安装
1、查看是否已经安装过mysql
    
    rpm -qa | grep mysql
有的话，我们就通过 rpm -e 命令 或者 rpm -e --nodeps 命令来卸载掉：

    rpm -e mysql　　// 普通删除模式 
    rpm -e --nodeps mysql　　// 强力删除模式，如果使用上面命令删除时，提示有依赖的其它文件，则用该命令可以对其进行强力删除
查看yum上提供的mysql数据库可下载的版本

    yum list | grep mysql 
2、开始安装mysql 
    
    yum install -y mysql-server mysql mysql-devel 
出现如下结果就是安装成功
![https://static.oschina.net/uploads/space/2016/1006/142751_9e0D_2607587.png](https://static.oschina.net/uploads/space/2016/1006/142751_9e0D_2607587.png)
