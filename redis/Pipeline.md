## 使用管道（pipeline）加速redis查询
参见：https://redis.io/topics/pipelining#some-real-world-code-example
### Request/Response protocols and RTT
reids是一个基于TCP的请求/响应协议的客户端与服务器的模型，这意味着通常一个请求包括以下几步：
* 客户端向服务器发送查询，并通常以阻塞的方式从socket套接字读取服务器响应。
* 服务器处理命令并将响应发送回客户端。

例如，四个命令序列就是这样的：
* Client: INCR X
* Server: 1
* Client: INCR X
* Server: 2
* Client: INCR X
* Server: 3
* Client: INCR X
* Server: 4

其执行过程如下：
![http://img.blog.csdn.net/20151012195816208](http://img.blog.csdn.net/20151012195816208)
客户端和服务器通过网络进行连接，这个网络连接可以非常快(一个循环接口)也可以非常慢(通互联网在两台主机之间建立很多跳转的连接)。
无论网络延迟如何，数据包有时间从客户端传输到服务器，然后从服务器传回客户端以进行回复。

这一次被称为RTT（往返时间）。当客户端需要连续执行多个请求时（例如，将许多元素添加到同一个列表或使用多个键填充数据库），很容易看到这会如何影响性能。
例如，如果RTT时间为250毫秒（在因特网上连接速度非常慢的情况下），即使服务器能够每秒处理100k个请求，我们也将能够每秒处理最多四个请求。

如果使用的接口是loopback接口，则RTT时间要短得多（例如，我的主机报告0.0,040毫秒ping 127.0.0.1），但如果您需要在一行中执行多次写入，则仍然很慢。

幸运的是，有一种方法可以改善这种用例。

### Redis Pipelining
可以实现请求/响应服务器，以便即使客户端尚未读取旧响应，它也能够处理新的请求。 通过这种方式，可以发送多个命令到服务器而无需等待回复，
最后一次就可以读取返回值。

这被称为管道技术，并且是数十年以来广泛使用的技术。 例如，许多POP3协议实现已经支持这个功能，显着加快了从服务器下载新电子邮件的过程。

Redis自早期开始就支持管道操作，因此无论您运行哪种版本，都可以使用Redis进行流管道操作。 这是使用原始netcat实用程序的示例：
```
$ (printf "PING\r\nPING\r\nPING\r\n"; sleep 1) | nc localhost 6379
+PONG
+PONG
+PONG
```
这次我们没有为每次操作消耗RTT，对于三条命令我们只消耗了一次。要非常明确地说，通过管道操作，我们第一个例子的操作顺序如下：
* Client: INCR X
* Client: INCR X
* Client: INCR X
* Client: INCR X
* Server: 1
* Server: 2
* Server: 3
* Server: 4

其执行过程如下：
![http://img.blog.csdn.net/20151012200300532](http://img.blog.csdn.net/20151012200300532)
重要提示：当客户端使用管道发送命令时，服务器将被迫使用内存排队答复。所以如果你需要用管道发送很多命令，最好把它们作为具有合理数量的批处理发送，
例如10k命令，读取答复，然后再发送另一个10k命令，等等。速度将几乎相同，但使用的额外内存将最大限度地排列此10k命令的回复。

### It's not just a matter of RTT
管道不仅仅是为了减少往返时间所带来的延迟成本，它实际上可以提高您在给定的Redis服务器上每秒执行的总操作量。 这是事实的结果，即在不使用管道的情况下，
从访问数据结构和生成答复的角度来看，每个命令的处理都非常块，但从执行socket套接字I /O. 这涉及调用系统的read（）和write（），
这意味着从用户登陆到内核登陆。 上下文切换是一个巨大的速度惩罚。

当使用管道时，许多命令通常通过单个read（）系统调用来读取，并且通过一次write（）系统调用来传递多个响应。 
因此，每秒执行的总查询数量最初几乎随着较长的管道线性增加，并最终达到未使用管道的基线的10倍，如下图所示：
![http://redis.io/images/redisdoc/pipeline_iops.png](http://redis.io/images/redisdoc/pipeline_iops.png)

### Some real world code example
在以下基准测试中，我们将使用支持管道的Redis Ruby客户端来测试由于管道而导致的速度提升：
```
require 'rubygems'
require 'redis'

def bench(descr)
    start = Time.now
    yield
    puts "#{descr} #{Time.now-start} seconds"
end

def without_pipelining
    r = Redis.new
    10000.times {
        r.ping
    }
end

def with_pipelining
    r = Redis.new
    r.pipelined {
        10000.times {
            r.ping
        }
    }
end

bench("without pipelining") {
    without_pipelining
}
bench("with pipelining") {
    with_pipelining
}
```
运行上述简单脚本将在我的Mac OS X系统中提供以下图形，通过loopback接口运行，其中管道将提供最小的改进，因为RTT已经非常低：
```
without pipelining 1.185238 seconds
with pipelining 0.250783 seconds
```
正如您所看到的，使用管道，我们将传输改进了五倍。
### Pipelining VS Scripting
使用Redis脚本（Redis版本2.6或更高版本中可用），编写许多用于管道的用例可以更高效地利用脚本执行服务器端所需的大量工作。。 
脚本的一大优点是它能够以最小的延迟读取和写入数据，使得读取，计算，写入等操作非常快速（在这种情况下管道操作无法提供帮助，
因为客户端需要先读取服务端返回值然后才可以调用写命令）。

有时，应用程序可能还想在管道中发送EVAL或EVALSHA命令。 这是完全可能的，并且Redis通过SCRIPT LOAD命令明确支持它
（它保证可以在没有失败风险的情况下调用EVALSHA）。

### Appendix: why a busy loops are slow even on the loopback interface?
即使在本页面中包含了所有背景信息，您仍然可能想知道为什么Redis基准测试如下所示（以伪代码形式），即使在loopback接口中执行时，
服务器和客户端在同一物理机器上运行时，速度也很慢：
```
FOR-ONE-SECOND:
    Redis.SET("foo","bar")
END
```
毕竟，如果Redis进程和基准测试都在同一个机器上运行，那么这不仅仅是通过内存从一个地方复制到另一个地方，而没有任何实际的延迟和实际网络？

原因是系统中的进程并不总是在运行，实际上它是通过内核调度器来让一个进程运行，所以会发生什么，例如，允许基准运行，
从Redis服务器读取回复（关系到执行的最后一个命令），并写入一个新的命令。 该命令现在位于loopback接口缓冲区中，但为了被服务器读取，
内核应该安排服务器进程（当前阻塞在系统调用中）运行，等等。 因此，实际上，由于内核调度程序的工作原理，loopback接口仍然涉及网络延迟。

基本上，一个繁忙的循环基准测试是在网络服务器中测量性能时可以完成的最难的事情。 明智的做法是避免这种方式的基准测试。



