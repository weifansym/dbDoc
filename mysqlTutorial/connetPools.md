##MySql数据库连接池
一、什么是数据库连接池？
官方：数据库连接池（Connection pooling）是程序启动时建立足够的数据库连接，并将这些连接组成一个连接池，由程序动态地对池中的连接进行申请，使用，释放。
个人理解：创建数据库连接是一个很耗时的操作，也容易对数据库造成安全隐患。所以，在程序初始化的时候，集中创建多个数据库连接，并把他们集中管理，供程序使用，
可以保证较快的数据库读写速度，还更加安全可靠。

二、传统的连接机制与数据库连接池的运行机制区别
　传统统链接:     一般来说，Java应用程序访问数据库的过程是：

　　①装载数据库驱动程序；

　　②通过JDBC建立数据库连接；

　　③访问数据库，执行SQL语句；

　　④断开数据库连接。

使用了数据库连接池的机制：
（1）  程序初始化时创建连接池
（2） 使用时向连接池申请可用连接
（3） 使用完毕，将连接返还给连接池
（4） 程序退出时，断开所有连接，并释放资源
[连接池](https://images2018.cnblogs.com/blog/137084/201805/137084-20180524194122461-804315041.png)

### 一. 为何要使用数据库连接池
假设网站一天有很大的访问量，数据库服务器就需要为每次连接创建一次数据库连接，极大的浪费数据库的资源，并且极易造成数据库服务器内存溢出、拓机。
数据库连接是一种关键的有限的昂贵的资源,这一点在多用户的网页应用程序中体现的尤为突出.对数据库连接的管理能显著影响到整个应用程序的伸缩性和健壮性,
影响到程序的性能指标.数据库连接池正式针对这个问题提出来的.数据库连接池负责分配,管理和释放数据库连接,它允许应用程序重复使用一个现有的数据库连接,
而不是重新建立一个。


数据库连接池在初始化时将创建一定数量的数据库连接放到连接池中, 这些数据库连接的数量是由最小数据库连接数来设定的.无论这些数据库连接是否被使用,
连接池都将一直保证至少拥有这么多的连接数量.连接池的最大数据库连接数量限定了这个连接池能占有的最大连接数,当应用程序向连接池请求的连接数超过最大连
接数量时,这些请求将被加入到等待队列中.

数据库连接池的最小连接数和最大连接数的设置要考虑到以下几个因素:
1. 最小连接数:是连接池一直保持的数据库连接,所以如果应用程序对数据库连接的使用量不大,将会有大量的数据库连接资源被浪费.
2. 最大连接数:是连接池能申请的最大连接数,如果数据库连接请求超过次数,后面的数据库连接请求将被加入到等待队列中,这会影响以后的数据库操作
3. 如果最小连接数与最大连接数相差很大:那么最先连接请求将会获利,之后超过最小连接数量的连接请求等价于建立一个新的数据库连接.不过,这些大于最小连接数的
数据库连接在使用完不会马上被释放,他将被放到连接池中等待重复使用或是空间超时后被释放.

### 二、使用数据库连接池的关键点
1、并发问题
为了使连接管理服务具有最大的通用性，必须考虑多线程环境，即并发问题。这个问题相对比较好解决，因为各个语言自身提供了对并发管理的支持像java,c#等等，
使用synchronized(java)lock(C#)关键字即可确保线程是同步的。使用方法可以参考，相关文献。

２、事务处理
DB连接池必须要确保某一时间内一个 conn 只能分配给一个线程。不同 conn 的事务是相互独立的。 
我们知道，事务具有原子性，此时要求对数据库的操作符合“ALL-ALL-NOTHING”原则,即对于一组SQL语句要么全做，要么全不做。 
我们知道当２个线程共用一个连接Connection对象，而且各自都有自己的事务要处理时候，对于连接池是一个很头疼的问题，因为即使Connection类提供了相应的事务
支持，可是我们仍然不能确定那个数据库操作是对应那个事务的，这是由于我们有２个线程都在进行事务操作而引起的。为此我们可以使用每一个事务独占一个连接来实现，
虽然这种方法有点浪费连接池资源但是可以大大降低事务管理的复杂性。 

３、连接池的分配与释放
连接池的分配与释放，对系统的性能有很大的影响。合理的分配与释放，可以提高连接的复用度，从而降低建立新连接的开销，同时还可以加快用户的访问速度。 
对于连接的管理可使用一个List。即把已经创建的连接都放入List中去统一管理。每当用户请求一个连接时，系统检查这个List中有没有可以分配的连接。如果有
就把那个最合适的连接分配给他（如何能找到最合适的连接文章将在关键议题中指出）；如果没有就抛出一个异常给用户，List中连接是否可以被分配由一个线程来专
门管理捎后我会介绍这个线程的具体实现。

４、连接池的配置与维护
连接池中到底应该放置多少连接，才能使系统的性能最佳？系统可采取设置最小连接数（minConnection）和最大连接数（maxConnection）等参数来控制连接池中的
连接。比方说，最小连接数是系统启动时连接池所创建的连接数。如果创建过多，则系统启动就慢，但创建后系统的响应速度会很快；如果创建过少，则系统启动的很快，
响应起来却慢。这样，可以在开发时，设置较小的最小连接数，开发起来会快，而在系统实际使用时设置较大的，因为这样对访问客户来说速度会快些。最大连接数是连接
池中允许连接的最大数目，具体设置多少，要看系统的访问量，可通过软件需求上得到。 
如何确保连接池中的最小连接数呢？有动态和静态两种策略。动态即每隔一定时间就对连接池进行检测，如果发现连接数量小于最小连接数，则补充相应数量的新连接,以
保证连接池的正常运转。静态是发现空闲连接不够时再去检查。

### 三、使用数据库连接池的优势和其工作原理
1、连接池的优势
连接池用于创建和管理数据库连接的缓冲池技术，缓冲池中的连接可以被任何需要他们的线程使用。当一个线程需要用JDBC对一个数据库操作时，将从池中请求一个连接。
当这个连接使用完毕后，将返回到连接池中，等待为其他的线程服务。

连接池的主要优点有以下三个方面。

第一、减少连接创建时间。连接池中的连接是已准备好的、可重复使用的，获取后可以直接访问数据库，因此减少了连接创建的次数和时间。

第二、简化的编程模式。当使用连接池时，每一个单独的线程能够像创建一个自己的JDBC连接一样操作，允许用户直接使用JDBC编程技术。

第三、控制资源的使用。如果不使用连接池，每次访问数据库都需要创建一个连接，这样系统的稳定性受系统连接需求影响很大，很容易产生资源浪费和高负载异常。
连接池能够使性能最大化，将资源利用控制在一定的水平之下。连接池能控制池中的连接数量，增强了系统在大量用户应用时的稳定性。

2、连接池的工作原理
下面，简单的阐述下连接池的工作原理。

连接池技术的核心思想是连接复用，通过建立一个数据库连接池以及一套连接使用、分配和管理策略，使得该连接池中的连接可以得到高效、安全的复用，避免了数据库连
接频繁建立、关闭的开销。

连接池的工作原理主要由三部分组成，分别为连接池的建立、连接池中连接的使用管理、连接池的关闭。

第一、连接池的建立。一般在系统初始化时，连接池会根据系统配置建立，并在池中创建了几个连接对象，以便使用时能从连接池中获取。连接池中的连接不能随意创建和
关闭，这样避免了连接随意建立和关闭造成的系统开销。Java中提供了很多容器类可以方便的构建连接池，例如Vector、Stack等。

第二、连接池的管理。连接池管理策略是连接池机制的核心，连接池内连接的分配和释放对系统的性能有很大的影响。其管理策略是：

当客户请求数据库连接时，首先查看连接池中是否有空闲连接，如果存在空闲连接，则将连接分配给客户使用；如果没有空闲连接，则查看当前所开的连接数是否已经达到
最大连接数，如果没达到就重新创建一个连接给请求的客户；如果达到就按设定的最大等待时间进行等待，如果超出最大等待时间，则抛出异常给客户。
当客户释放数据库连接时，先判断该连接的引用次数是否超过了规定值，如果超过就从连接池中删除该连接，否则保留为其他客户服务。

该策略保证了数据库连接的有效复用，避免频繁的建立、释放连接所带来的系统资源开销。

第三、连接池的关闭。当应用程序退出时，关闭连接池中所有的连接，释放连接池相关的资源，该过程正好与创建相反。

 3、常用的连接池：
(1) dbcp
dbcp可能是使用最多的开源连接池，原因大概是因为配置方便，而且很多开源和tomcat应用例子都是使用的这个连接池吧。
这个连接池可以设置最大和最小连接，连接等待时间等，基本功能都有。这个连接池的配置参见附件压缩包中的:dbcp.xml
使用评价：在具体项目应用中，发现此连接池的持续运行的稳定性还是可以，不过速度稍慢，在大并发量的压力下稳定性
有所下降，此外不提供连接池监控

常用的参数(阿里面试问常用的参数)：  

我们来看DBCP 的例子, 然后根据例子来分析:
```
#连接设置
driverClassName=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/day14
username=root
password=abc

#<!-- 初始化连接 -->
initialSize=10

#最大连接数量
maxActive=50

#<!-- 最大空闲连接 -->
maxIdle=20

#<!-- 最小空闲连接 -->
minIdle=5

#<!-- 超时等待时间以毫秒为单位 60000毫秒/1000等于60秒 -->
maxWait=60000


#JDBC驱动建立连接时附带的连接属性属性的格式必须为这样：[属性名=property;] 
#注意："user" 与 "password" 两个属性会被明确地传递，因此这里不需要包含他们。
connectionProperties=useUnicode=true;characterEncoding=utf8

#指定由连接池所创建的连接的自动提交（auto-commit）状态。
defaultAutoCommit=true

#driver default 指定由连接池所创建的连接的只读（read-only）状态。
#如果没有设置该值，则“setReadOnly”方法将不被调用。（某些驱动并不支持只读模式，如：Informix）
defaultReadOnly=

#driver default 指定由连接池所创建的连接的事务级别（TransactionIsolation）。
#可用值为下列之一：（详情可见javadoc。）NONE,READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
defaultTransactionIsolation=REPEATABLE_READ

DBCP配置文件
```
配置参数详解：

MaxActive：连接池的最大数据库连接数。设为0表示无限制。maxActive是最大激活连接数，这里取值为20，表示同时最多有20个数据库连　
maxIdle：连接池中最多可空闲maxIdle个连接,maxIdle是最大的空闲连接数，这里取值为20，表示即使没有数据库连接时依然可以保持20空闲的连接，而不被清除，
随时处于待命状态
minIdle：连接池中最少空闲maxIdle个连接 
initialSize：初始化连接数目 
maxWait：连接池中连接用完时,新的请求等待时间,毫秒 MaxWait是最大等待秒钟数，这里取值-1，表示无限等待，直到超时为止，也可取值9000，表示9秒后超时。
maxIdle：最大空闲数，数据库连接的最大空闲时间。超过空闲时间，数据库连
接将被标记为不可用，然后被释放。设为0表示无限制。

(2) c3p0
c3p0是另外一个开源的连接池，在业界也是比较有名的，这个连接池可以设置最大和最小连接，连接等待时间等，基本功能都有。
这个连接池的配置参见附件压缩包中的:c3p0.xml。
使用评价：在具体项目应用中，发现此连接池的持续运行的稳定性相当不错，在大并发量的压力下稳定性也有一定保证，此外不提供连接池监控。          

1.Apache commons-dbcp 连接池
下载：http://commons.apache.org/proper/commons-dbcp/ 

2.c3p0 数据库连接池
下载：http://sourceforge.net/projects/c3p0/

程序开发过程中，存在很多问题：

首先，每一次web请求都要建立一次数据库连接。建立连接是一个费时的活动，每次都得花费0.05s～1s的时间，而且系统还要分配内存资源。这个时间对于一次或几次数
据库操作，或许感觉不出系统有多大的开销。

可是对于现在的web应用，尤其是大型电子商务网站，同时有几百人甚至几千人在线是很正常的事。在这种情况下，频繁的进行数据库连接操作势必占用很多的系统资源，
网站的响应速度必定下降，严重的甚至会造成服务器的崩溃。不是危言耸听，这就是制约某些电子商务网站发展的技术瓶颈问题。其次，对于每一次数据库连接，使用完后
都得断开。否则，如果程序出现异常而未能关闭，将会导致数据库系统中的内存泄漏，最终将不得不重启数据库

通过上面的分析，我们可以看出来，“数据库连接”是一种稀缺的资源，为了保障网站的正常使用，应该对其进行妥善管理。其实我们查询完数据库后，如果不关闭连接，
而是暂时存放起来，当别人使用时，把这个连接给他们使用。就避免了一次建立数据库连接和断开的操作时间消耗。

数据库连接池的基本思想：就是为数据库连接建立一个“缓冲池”。预先在缓冲池中放入一定数量的连接，当需要建立数据库连接时，只需从“缓冲池”中取出一个，使用完
毕之后再放回去。我们可以通过设定连接池最大连接数来防止系统无尽的与数据库连接

创建数据库连接池大概有3个步骤：

① 创建ConnectionPool实例，并初始化创建10个连接，保存在Vector中（线程安全）单例模式实现
② 实现getConnection()从连接库中获取一个可用的连接
③ returnConnection(conn) 提供将连接放回连接池中方法

　　连接池的实现

　　1、连接池模型

　　本文讨论的连接池包括一个连接池类（DBConnectionPool）和一个连接池管理类（DBConnetionPoolManager）。连接池类是对某一数据库所有连接的“缓冲池”，主要实现以下功能：①从连接池获取或创建可用连接；②使用完毕之后，把连接返还给连接池；③在系统关闭前，断开所有连接并释放连接占用的系统资源；④还能够处理无效连接（原来登记为可用的连接，由于某种原因不再可用，如超时，通讯问题），并能够限制连接池中的连接总数不低于某个预定值和不超过某个预定值。

　　连接池管理类是连接池类的外覆类（wrapper）,符合单例模式，即系统中只能有一个连接池管理类的实例。其主要用于对多个连接池对象的管理，具有以下功能：①装载并注册特定数据库的JDBC驱动程序；②根据属性文件给定的信息，创建连接池对象；③为方便管理多个连接池对象，为每一个连接池对象取一个名字，实现连接池名字与其实例之间的映射；④跟踪客户使用连接情况，以便需要是关闭连接释放资源。连接池管理类的引入主要是为了方便对多个连接池的使用和管理，如系统需要连接不同的数据库，或连接相同的数据库但由于安全性问题，需要不同的用户使用不同的名称和密码。

连接池源码：

ConnectionPool.Java 
```
[java] view plain copy print?
//////////////////////////////// 数据库连接池类 ConnectionPool.java ////////////////////////////////////////  
  
/* 
 这个例子是根据POSTGRESQL数据库写的， 
 请用的时候根据实际的数据库调整。 
 调用方法如下： 
 ①　ConnectionPool connPool  
 = new ConnectionPool("com.microsoft.jdbc.sqlserver.SQLServerDriver" 
 ,"jdbc:microsoft:sqlserver://localhost:1433;DatabaseName=MyDataForTest" 
 ,"Username" 
 ,"Password"); 
 ②　connPool .createPool(); 
 Connection conn = connPool .getConnection(); 
 connPool.returnConnection(conn);  
 connPool.refreshConnections(); 
 connPool.closeConnectionPool(); 
 */  
import java.sql.Connection;  
import java.sql.DatabaseMetaData;  
import java.sql.Driver;  
import java.sql.DriverManager;  
import java.sql.SQLException;  
import java.sql.Statement;  
import java.util.Enumeration;  
import java.util.Vector;  
  
public class ConnectionPool {  
    private String jdbcDriver = ""; // 数据库驱动  
    private String dbUrl = ""; // 数据 URL  
    private String dbUsername = ""; // 数据库用户名  
    private String dbPassword = ""; // 数据库用户密码  
    private String testTable = ""; // 测试连接是否可用的测试表名，默认没有测试表  
      
    private int initialConnections = 10; // 连接池的初始大小  
    private int incrementalConnections = 5;// 连接池自动增加的大小  
    private int maxConnections = 50; // 连接池最大的大小  
    private Vector connections = null; // 存放连接池中数据库连接的向量 , 初始时为 null  
    // 它中存放的对象为 PooledConnection 型  
  
    /** 
     * 构造函数 
     *  
     * @param jdbcDriver 
     *            String JDBC 驱动类串 
     * @param dbUrl 
     *            String 数据库 URL 
     * @param dbUsername 
     *            String 连接数据库用户名 
     * @param dbPassword 
     *            String 连接数据库用户的密码 
     *  
     */  
    public ConnectionPool(String jdbcDriver, String dbUrl, String dbUsername,  
            String dbPassword) {  
        this.jdbcDriver = jdbcDriver;  
        this.dbUrl = dbUrl;  
        this.dbUsername = dbUsername;  
        this.dbPassword = dbPassword;  
    }  
  
    /** 
     * 返回连接池的初始大小 
     *  
     * @return 初始连接池中可获得的连接数量 
     */  
    public int getInitialConnections() {  
        return this.initialConnections;  
    }  
    /** 
     * 设置连接池的初始大小 
     *  
     * @param 用于设置初始连接池中连接的数量 
     */  
    public void setInitialConnections(int initialConnections) {  
        this.initialConnections = initialConnections;  
    }  
    /** 
     * 返回连接池自动增加的大小 、 
     *  
     * @return 连接池自动增加的大小 
     */  
    public int getIncrementalConnections() {  
        return this.incrementalConnections;  
    }  
    /** 
     * 设置连接池自动增加的大小 
     *  
     * @param 连接池自动增加的大小 
     */  
  
    public void setIncrementalConnections(int incrementalConnections) {  
        this.incrementalConnections = incrementalConnections;  
    }  
    /** 
     * 返回连接池中最大的可用连接数量 
     *  
     * @return 连接池中最大的可用连接数量 
     */  
    public int getMaxConnections() {  
        return this.maxConnections;  
    }  
    /** 
     * 设置连接池中最大可用的连接数量 
     *  
     * @param 设置连接池中最大可用的连接数量值 
     */  
    public void setMaxConnections(int maxConnections) {  
        this.maxConnections = maxConnections;  
    }  
  
    /** 
     * 获取测试数据库表的名字 
     *  
     * @return 测试数据库表的名字 
     */  
  
    public String getTestTable() {  
        return this.testTable;  
    }  
  
    /** 
     * 设置测试表的名字 
     *  
     * @param testTable 
     *            String 测试表的名字 
     */  
  
    public void setTestTable(String testTable) {  
        this.testTable = testTable;  
    }  
  
    /** 
     *  
     * 创建一个数据库连接池，连接池中的可用连接的数量采用类成员 initialConnections 中设置的值 
     */  
  
    public synchronized void createPool() throws Exception {  
        // 确保连接池没有创建  
        // 如果连接池己经创建了，保存连接的向量 connections 不会为空  
        if (connections != null) {  
            return; // 如果己经创建，则返回  
        }  
        // 实例化 JDBC Driver 中指定的驱动类实例  
        Driver driver = (Driver) (Class.forName(this.jdbcDriver).newInstance());  
        DriverManager.registerDriver(driver); // 注册 JDBC 驱动程序  
        // 创建保存连接的向量 , 初始时有 0 个元素  
        connections = new Vector();  
        // 根据 initialConnections 中设置的值，创建连接。  
        createConnections(this.initialConnections);  
        // System.out.println(" 数据库连接池创建成功！ ");  
    }  
  
    /** 
     * 创建由 numConnections 指定数目的数据库连接 , 并把这些连接 放入 connections 向量中 
     *  
     * @param numConnections 
     *            要创建的数据库连接的数目 
     */  
  
    private void createConnections(int numConnections) throws SQLException {  
        // 循环创建指定数目的数据库连接  
        for (int x = 0; x < numConnections; x++) {  
            // 是否连接池中的数据库连接的数量己经达到最大？最大值由类成员 maxConnections  
            // 指出，如果 maxConnections 为 0 或负数，表示连接数量没有限制。  
            // 如果连接数己经达到最大，即退出。  
            if (this.maxConnections > 0  
                    && this.connections.size() >= this.maxConnections) {  
                break;  
            }  
            // add a new PooledConnection object to connections vector  
            // 增加一个连接到连接池中（向量 connections 中）  
            try {  
                connections.addElement(new PooledConnection(newConnection()));  
            } catch (SQLException e) {  
                System.out.println(" 创建数据库连接失败！ " + e.getMessage());  
                throw new SQLException();  
            }  
            // System.out.println(" 数据库连接己创建 ......");  
        }  
    }  
    /** 
     * 创建一个新的数据库连接并返回它 
     *  
     * @return 返回一个新创建的数据库连接 
     */  
    private Connection newConnection() throws SQLException {  
        // 创建一个数据库连接  
        Connection conn = DriverManager.getConnection(dbUrl, dbUsername,  
                dbPassword);  
        // 如果这是第一次创建数据库连接，即检查数据库，获得此数据库允许支持的  
        // 最大客户连接数目  
        // connections.size()==0 表示目前没有连接己被创建  
        if (connections.size() == 0) {  
            DatabaseMetaData metaData = conn.getMetaData();  
            int driverMaxConnections = metaData.getMaxConnections();  
            // 数据库返回的 driverMaxConnections 若为 0 ，表示此数据库没有最大  
            // 连接限制，或数据库的最大连接限制不知道  
            // driverMaxConnections 为返回的一个整数，表示此数据库允许客户连接的数目  
            // 如果连接池中设置的最大连接数量大于数据库允许的连接数目 , 则置连接池的最大  
            // 连接数目为数据库允许的最大数目  
            if (driverMaxConnections > 0  
                    && this.maxConnections > driverMaxConnections) {  
                this.maxConnections = driverMaxConnections;  
            }  
        }  
        return conn; // 返回创建的新的数据库连接  
    }  
  
    /** 
     * 通过调用 getFreeConnection() 函数返回一个可用的数据库连接 , 如果当前没有可用的数据库连接，并且更多的数据库连接不能创 
     * 建（如连接池大小的限制），此函数等待一会再尝试获取。 
     *  
     * @return 返回一个可用的数据库连接对象 
     */  
  
    public synchronized Connection getConnection() throws SQLException {  
        // 确保连接池己被创建  
        if (connections == null) {  
            return null; // 连接池还没创建，则返回 null  
        }  
        Connection conn = getFreeConnection(); // 获得一个可用的数据库连接  
        // 如果目前没有可以使用的连接，即所有的连接都在使用中  
        while (conn == null) {  
            // 等一会再试  
            // System.out.println("Wait");  
            wait(250);  
            conn = getFreeConnection(); // 重新再试，直到获得可用的连接，如果  
            // getFreeConnection() 返回的为 null  
            // 则表明创建一批连接后也不可获得可用连接  
        }  
        return conn;// 返回获得的可用的连接  
    }  
  
    /** 
     * 本函数从连接池向量 connections 中返回一个可用的的数据库连接，如果 当前没有可用的数据库连接，本函数则根据 
     * incrementalConnections 设置 的值创建几个数据库连接，并放入连接池中。 如果创建后，所有的连接仍都在使用中，则返回 null 
     *  
     * @return 返回一个可用的数据库连接 
     */  
    private Connection getFreeConnection() throws SQLException {  
        // 从连接池中获得一个可用的数据库连接  
        Connection conn = findFreeConnection();  
        if (conn == null) {  
            // 如果目前连接池中没有可用的连接  
            // 创建一些连接  
            createConnections(incrementalConnections);  
            // 重新从池中查找是否有可用连接  
            conn = findFreeConnection();  
            if (conn == null) {  
                // 如果创建连接后仍获得不到可用的连接，则返回 null  
                return null;  
            }  
        }  
        return conn;  
    }  
  
    /** 
     * 查找连接池中所有的连接，查找一个可用的数据库连接， 如果没有可用的连接，返回 null 
     *  
     * @return 返回一个可用的数据库连接 
     */  
  
    private Connection findFreeConnection() throws SQLException {  
        Connection conn = null;  
        PooledConnection pConn = null;  
        // 获得连接池向量中所有的对象  
        Enumeration enumerate = connections.elements();  
        // 遍历所有的对象，看是否有可用的连接  
        while (enumerate.hasMoreElements()) {  
            pConn = (PooledConnection) enumerate.nextElement();  
            if (!pConn.isBusy()) {  
                // 如果此对象不忙，则获得它的数据库连接并把它设为忙  
                conn = pConn.getConnection();  
                pConn.setBusy(true);  
                // 测试此连接是否可用  
                if (!testConnection(conn)) {  
                    // 如果此连接不可再用了，则创建一个新的连接，  
                    // 并替换此不可用的连接对象，如果创建失败，返回 null  
                    try {  
                        conn = newConnection();  
                    } catch (SQLException e) {  
                        System.out.println(" 创建数据库连接失败！ " + e.getMessage());  
                        return null;  
                    }  
                    pConn.setConnection(conn);  
                }  
                break; // 己经找到一个可用的连接，退出  
            }  
        }  
        return conn;// 返回找到到的可用连接  
    }  
  
    /** 
     * 测试一个连接是否可用，如果不可用，关掉它并返回 false 否则可用返回 true 
     *  
     * @param conn 
     *            需要测试的数据库连接 
     * @return 返回 true 表示此连接可用， false 表示不可用 
     */  
  
    private boolean testConnection(Connection conn) {  
        try {  
            // 判断测试表是否存在  
            if (testTable.equals("")) {  
                // 如果测试表为空，试着使用此连接的 setAutoCommit() 方法  
                // 来判断连接否可用（此方法只在部分数据库可用，如果不可用 ,  
                // 抛出异常）。注意：使用测试表的方法更可靠  
                conn.setAutoCommit(true);  
            } else {// 有测试表的时候使用测试表测试  
                // check if this connection is valid  
                Statement stmt = conn.createStatement();  
                stmt.execute("select count(*) from " + testTable);  
            }  
        } catch (SQLException e) {  
            // 上面抛出异常，此连接己不可用，关闭它，并返回 false;  
            closeConnection(conn);  
            return false;  
        }  
        // 连接可用，返回 true  
        return true;  
    }  
  
    /** 
     * 此函数返回一个数据库连接到连接池中，并把此连接置为空闲。 所有使用连接池获得的数据库连接均应在不使用此连接时返回它。 
     *  
     * @param 需返回到连接池中的连接对象 
     */  
  
    public void returnConnection(Connection conn) {  
        // 确保连接池存在，如果连接没有创建（不存在），直接返回  
        if (connections == null) {  
            System.out.println(" 连接池不存在，无法返回此连接到连接池中 !");  
            return;  
        }  
        PooledConnection pConn = null;  
        Enumeration enumerate = connections.elements();  
        // 遍历连接池中的所有连接，找到这个要返回的连接对象  
        while (enumerate.hasMoreElements()) {  
            pConn = (PooledConnection) enumerate.nextElement();  
            // 先找到连接池中的要返回的连接对象  
            if (conn == pConn.getConnection()) {  
                // 找到了 , 设置此连接为空闲状态  
                pConn.setBusy(false);  
                break;  
            }  
        }  
    }  
  
    /** 
     * 刷新连接池中所有的连接对象 
     *  
     */  
  
    public synchronized void refreshConnections() throws SQLException {  
        // 确保连接池己创新存在  
        if (connections == null) {  
            System.out.println(" 连接池不存在，无法刷新 !");  
            return;  
        }  
        PooledConnection pConn = null;  
        Enumeration enumerate = connections.elements();  
        while (enumerate.hasMoreElements()) {  
            // 获得一个连接对象  
            pConn = (PooledConnection) enumerate.nextElement();  
            // 如果对象忙则等 5 秒 ,5 秒后直接刷新  
            if (pConn.isBusy()) {  
                wait(5000); // 等 5 秒  
            }  
            // 关闭此连接，用一个新的连接代替它。  
            closeConnection(pConn.getConnection());  
            pConn.setConnection(newConnection());  
            pConn.setBusy(false);  
        }  
    }  
  
    /** 
     * 关闭连接池中所有的连接，并清空连接池。 
     */  
  
    public synchronized void closeConnectionPool() throws SQLException {  
        // 确保连接池存在，如果不存在，返回  
        if (connections == null) {  
            System.out.println(" 连接池不存在，无法关闭 !");  
            return;  
        }  
        PooledConnection pConn = null;  
        Enumeration enumerate = connections.elements();  
        while (enumerate.hasMoreElements()) {  
            pConn = (PooledConnection) enumerate.nextElement();  
            // 如果忙，等 5 秒  
            if (pConn.isBusy()) {  
                wait(5000); // 等 5 秒  
            }  
            // 5 秒后直接关闭它  
            closeConnection(pConn.getConnection());  
            // 从连接池向量中删除它  
            connections.removeElement(pConn);  
        }  
        // 置连接池为空  
        connections = null;  
    }  
  
    /** 
     * 关闭一个数据库连接 
     *  
     * @param 需要关闭的数据库连接 
     */  
  
    private void closeConnection(Connection conn) {  
        try {  
            conn.close();  
        } catch (SQLException e) {  
            System.out.println(" 关闭数据库连接出错： " + e.getMessage());  
        }  
    }  
    /** 
     * 使程序等待给定的毫秒数 
     *  
     * @param 给定的毫秒数 
     */  
  
    private void wait(int mSeconds) {  
        try {  
            Thread.sleep(mSeconds);  
        } catch (InterruptedException e) {  
        }  
    }  
    /** 
     *  
     * 内部使用的用于保存连接池中连接对象的类 此类中有两个成员，一个是数据库的连接，另一个是指示此连接是否 正在使用的标志。 
     */  
  
    class PooledConnection {  
        Connection connection = null;// 数据库连接  
        boolean busy = false; // 此连接是否正在使用的标志，默认没有正在使用  
  
        // 构造函数，根据一个 Connection 构告一个 PooledConnection 对象  
        public PooledConnection(Connection connection) {  
            this.connection = connection;  
        }  
  
        // 返回此对象中的连接  
        public Connection getConnection() {  
            return connection;  
        }  
  
        // 设置此对象的，连接  
        public void setConnection(Connection connection) {  
            this.connection = connection;  
        }  
  
        // 获得对象连接是否忙  
        public boolean isBusy() {  
            return busy;  
        }  
  
        // 设置对象的连接正在忙  
        public void setBusy(boolean busy) {  
            this.busy = busy;  
        }  
    }  
  
}
```
ConnectionPoolUtils.java
```
/*连接池工具类，返回唯一的一个数据库连接池对象,单例模式*/  
public class ConnectionPoolUtils {  
    private ConnectionPoolUtils(){};//私有静态方法  
    private static ConnectionPool poolInstance = null;  
    public static ConnectionPool GetPoolInstance(){  
        if(poolInstance == null) {  
            poolInstance = new ConnectionPool(                     
                    "com.mysql.jdbc.Driver",                   
                    "jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf-8",                
                    "root", "123456");  
            try {  
                poolInstance.createPool();  
            } catch (Exception e) {  
                // TODO Auto-generated catch block  
                e.printStackTrace();  
            }  
        }  
        return poolInstance;  
    }  
}
```
ConnectionPoolTest.java 
```
import java.sql.Connection;  
import java.sql.DriverManager;  
import java.sql.ResultSet;  
import java.sql.SQLException;  
import java.sql.Statement;  
  
  
public class ConnectionTest {  
  
    /** 
     * @param args 
     * @throws Exception  
     */  
    public static void main(String[] args) throws Exception {  
         try {  
                  /*使用连接池创建100个连接的时间*/   
                   /*// 创建数据库连接库对象 
                   ConnectionPool connPool = new ConnectionPool("com.mysql.jdbc.Driver","jdbc:mysql://localhost:3306/test", "root", "123456"); 
                   // 新建数据库连接库 
                   connPool.createPool();*/  
               
                  ConnectionPool  connPool=ConnectionPoolUtils.GetPoolInstance();//单例模式创建连接池对象  
                    // SQL测试语句  
                   String sql = "Select * from pet";  
                   // 设定程序运行起始时间  
                   long start = System.currentTimeMillis();  
                         // 循环测试100次数据库连接  
                          for (int i = 0; i < 100; i++) {  
                              Connection conn = connPool.getConnection(); // 从连接库中获取一个可用的连接  
                              Statement stmt = conn.createStatement();  
                              ResultSet rs = stmt.executeQuery(sql);  
                              while (rs.next()) {  
                                  String name = rs.getString("name");  
                               //  System.out.println("查询结果" + name);  
                              }  
                              rs.close();  
                              stmt.close();  
                              connPool.returnConnection(conn);// 连接使用完后释放连接到连接池  
                          }  
                          System.out.println("经过100次的循环调用，使用连接池花费的时间:"+ (System.currentTimeMillis() - start) + "ms");  
                          // connPool.refreshConnections();//刷新数据库连接池中所有连接，即不管连接是否正在运行，都把所有连接都释放并放回到连接池。注意：这个耗时比较大。  
                         connPool.closeConnectionPool();// 关闭数据库连接池。注意：这个耗时比较大。  
                          // 设定程序运行起始时间  
                          start = System.currentTimeMillis();  
                            
                          /*不使用连接池创建100个连接的时间*/  
                         // 导入驱动  
                          Class.forName("com.mysql.jdbc.Driver");  
                          for (int i = 0; i < 100; i++) {  
                              // 创建连接  
                             Connection conn = DriverManager.getConnection(  
                                      "jdbc:mysql://localhost:3306/test", "root", "123456");  
                              Statement stmt = conn.createStatement();  
                              ResultSet rs = stmt.executeQuery(sql);  
                             while (rs.next()) {  
                              }  
                             rs.close();  
                             stmt.close();  
                             conn.close();// 关闭连接  
                         }  
                         System.out.println("经过100次的循环调用，不使用连接池花费的时间:"  
                                 + (System.currentTimeMillis() - start) + "ms");  
                     } catch (SQLException e) {  
                        e.printStackTrace();  
                     } catch (ClassNotFoundException e) {  
                         e.printStackTrace();  
                    }  
    }
```
DBCPUtils
```
public class DBCPUtils {
    private static DataSource ds;//定义一个连接池对象
    static{
        try {
            Properties pro = new Properties();
            pro.load(DBCPUtils.class.getClassLoader().getResourceAsStream("dbcpconfig.properties"));
            ds = BasicDataSourceFactory.createDataSource(pro);//得到一个连接池对象
        } catch (Exception e) {
            throw new ExceptionInInitializerError("初始化连接错误，请检查配置文件！");
        }
    }
    //从池中获取一个连接
    public static Connection getConnection() throws SQLException{
        return ds.getConnection();
    }
    
    public static void closeAll(ResultSet rs,Statement stmt,Connection conn){
        if(rs!=null){
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        
        if(stmt!=null){
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        
        if(conn!=null){
            try {
                conn.close();//关闭
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```
6.导入的jar包

commons-dbcp.jar：DBCP实现要导入的jar

commons-pool.jar： 连接池实现的依赖类

commons-collections.jar ：连接池实现的集合类

参考：
* https://www.cnblogs.com/zping/archive/2008/10/29/1322440.html
* https://www.jianshu.com/p/9908ebedc3f7
* https://www.cnblogs.com/aspirant/p/6747238.html
