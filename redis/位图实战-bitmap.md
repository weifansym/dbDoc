按照官网的说法，Redis位图Bitmaps不是实际的数据类型，而是在字符串类型上定义的一组面向位的操作。在Redis中字符串限制最大为512MB，所以位图中最大可以设置2^32个不同的位（42.9亿个）。
图位的最小单位是比特(bit)，每个bit的值只能是0或1。

> 位图的存储大小计算： （maxOffset / 8 / 1024 / 1024）MB。其中maxOffset为位图的最大位数
### 基本用法
#### SETBIT key offset value
设置指定key的值在offset处的bit值，offset从0开始。返回值为在offset处原来的bit值
```
# 通过位操作将 h 改成 i
127.0.0.1:6379> SET h h         # 二进制为 01101000
OK
127.0.0.1:6379> SETBIT h 7 1    # 将最后一位改成1 => 01101001
(integer) 0
127.0.0.1:6379> GET h
"i"
```
#### GETBIT key offset
获取指定key的值在offset处的bit值，offset从0开始。如果offset超出了当前位图的范围，则返回0。
```
127.0.0.1:6379> set i i       # 二进制为 01101001
OK
127.0.0.1:6379> getbit i 0    # 第1位为0
(integer) 0
127.0.0.1:6379> getbit i 1    # 第2位为0
(integer) 1
127.0.0.1:6379> getbit i 7    # 第8位为0
(integer) 1
```
#### BITCOUNT key [start end]
统计指定key值中被设置为1的bit数。可以通过指定参数star和end来限制统计范围。
> 注意，这里的star和end不是指bit的下标，而是字节(byte)的下标。比如start为1，则实际对应的bit下标为8（1byte = 8 bit）

```
127.0.0.1:6379> set hi hi           # 二进制为 0110100001101001
OK
127.0.0.1:6379> bitcount hi         # 所有是1的位数：7个
(integer) 7
127.0.0.1:6379> bitcount hi 1 2     # 即统计 01101001 中1的位数
(integer) 4
```
基本命令的用法可以参见：
http://redisdoc.com/bitmap/index.html

#### 场景实战
这里用一个用户签到的例子来讲解如何在实战中应用，需求：
* 实现用户签到
* 统计今天所有的签到数量
* 获取指定用户全年的签到数
* 统计近7天连续签到的用户数量
* 统计本月全部签到过的用户数量
* 统计近7天有过签到的用户数量

使用位图的好处：
* 最直观的一点占用存储少，1个人1年的数据也就365 bit，46个字节；
* 通过位运算操作多个字符串，效率高；
* 当别人还在用数据库记录签到信息的时候，你用位图操作，逼格一下就上去了；

这里基于SpringBoot进行演示:
* 每天的签到情况作为一条记录，key格式为sign:{yyyyMMdd}
* 用户ID作为偏移量

#### 用户签到
将用户ID作为偏移量，通过setBit设置该位置的值为1

#### 查询用户今天是否已经签到了
将用户ID作为偏移量，通过getBit查询该位置上的值是否为1

#### 统计今天所有的签到数量
通过bitCount去实现统计

#### 统计指定用户全年的签到数
Redis中并没有提供对多个二进制位字符串进行求和操作，我们需要自己去统计。思路：
* 获取本年所有签到记录的key列表，即sign:2020开头的key，可以通过Redis指令keys sign:2020*获取
* 遍历获取到的key列表，统计已经签到过的key的数量

#### 统计近7天连续签到的用户数量
* 对近7天的签到记录的进行逻辑与操作，生成一个连续七天签到的记录
* 对生成的记录进行bitCount
#### 统计近7天有过签到的用户数量
和统计7天连续签到思路一样，只是这里使用逻辑或操作

#### 完整代码
#### Service
```
@Service
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    public RedisService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 获取指定格式的key
     *
     * @param pattern 格式
     * @return set
     */
    public Set<String> getKeys(String pattern) {
        return stringRedisTemplate.keys(pattern);
    }

    /**
     * 设置指定位的值
     *
     * @param key    键
     * @param offset 偏移量 0开始 对应bit的位置
     * @param value  true为1，false为0
     * @return boolean
     */
    public Boolean setBit(String key, long offset, boolean value) {
        return stringRedisTemplate.opsForValue().setBit(key, offset, value);
    }

    /**
     * 获取指定位的值
     *
     * @param key    键
     * @param offset 偏移量 0开始
     * @return boolean
     */
    public Boolean getBit(String key, long offset) {
        return stringRedisTemplate.opsForValue().getBit(key, offset);
    }

    /**
     * 统计字符串被设置为1的bit数
     *
     * @param key 键
     * @return long
     */
    public Long bitCount(String key) {
        return stringRedisTemplate.execute(
                (RedisCallback<Long>) connection -> connection.bitCount(key.getBytes())
        );
    }

    /**
     * 统计字符串指定位上被设置为1的bit数
     *
     * @param key   键
     * @param start 开始位置  注意对应byte的位置,是bit位置*8
     * @param end   结束位置
     * @return long
     */
    public Long bitCount(String key, long start, long end) {
        return stringRedisTemplate.execute(
                (RedisCallback<Long>) connection -> connection.bitCount(key.getBytes(), start, end)
        );
    }

    /**
     * 不同字符串之间进行位操作
     *
     * @param op      操作类型：与、或、异或、否
     * @param destKey 最终存放结构的键
     * @param keys    要操作的键
     * @return Long
     */
    public Long bitOp(RedisStringCommands.BitOperation op, String destKey, Collection<String> keys) {
        int size = keys.size();
        byte[][] bytes = new byte[size][];

        int index = 0;
        for (String key : keys) {
            bytes[index++] = key.getBytes();
        }
        return stringRedisTemplate.execute((RedisCallback<Long>) con -> con.bitOp(op, destKey.getBytes(), bytes));
    }

    /**
     * 对符合指定格式的key值进行未操作
     *
     * @param op      操作类型：与、或、异或、否
     * @param destKey 存放结果的键
     * @param pattern key格式
     * @return Long
     */
    public Long bitOp(RedisStringCommands.BitOperation op, String destKey, String pattern) {
        Set<String> keys = getKeys(pattern);
        int size = keys.size();
        if (size == 0) {
            return 0L;
        }
        byte[][] bytes = new byte[size][];

        int index = 0;
        for (String key : keys) {
            bytes[index++] = key.getBytes();
        }
        return stringRedisTemplate.execute((RedisCallback<Long>) con -> con.bitOp(op, destKey.getBytes(), bytes));
    }
}
```
#### controller
```
@RestController
@RequestMapping("/redis/bit")
public class BitMapController {

    private final DateTimeFormatter formatters = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 定义签到前缀
     * key格式为 sing:{yyyyMMdd}
     */
    private static final String SIGN_PREFIX = "sign:";

    /**
     * 连续一周签到
     */
    private static final String SIGN_ALL_WEEK_KEY = "signAllWeek";

    /**
     * 连续一个月签到
     */
    private static final String SIGN_ALL_MONTH_KEY = "signAllMonth";

    /**
     * 一周内有签到过的
     */
    private static final String SIGN_IN_WEEK_KEY = "signInWeek";

    private final RedisService redisService;

    public BitMapController(RedisService redisService) {
        this.redisService = redisService;
    }

    /**
     * 初始化本年今天之前的测试数据
     */
    @GetMapping("/init")
    public void initData() {
        // 获取本年的日期列表
        List<String> dateKeyList = new ArrayList<>();
        LocalDate curDate = LocalDate.now();
        LocalDate beginDate = LocalDate.parse("2020-01-01");
        while (beginDate.isBefore(curDate)) {
            dateKeyList.add(SIGN_PREFIX + beginDate.format(formatters));
            beginDate = beginDate.plusDays(1);
        }
        // 是否签到
        boolean isSign;
        StringBuilder signInfo;
        for (int i = 1; i < 6; i++) {
            signInfo = new StringBuilder("用户【").append(i).append("】：");
            for (String dateKey : dateKeyList) {
                if (i == 1) {
                    // 用户1全部签到
                    isSign = true;
                } else {
                    // 其他用户随机
                    isSign = Math.random() > 0.5;
                }
                redisService.setBit(dateKey, i, isSign);
                signInfo.append(isSign ? 1 : 0).append(", ");
            }
            System.out.println(signInfo.toString());
        }
    }

    /**
     * 用户当天签到
     * 用户ID作为位图的偏移量
     */
    @GetMapping("/sign/{userId}")
    public String sign(@PathVariable Long userId) {
        redisService.setBit(SIGN_PREFIX + getCurDate(), userId, true);
        return "签到成功";
    }

    /**
     * 查询用户今天是否已经签到了
     */
    @GetMapping("/isSign/{userId}")
    public String isSign(@PathVariable Long userId) {
        Boolean isSign = redisService.getBit(SIGN_PREFIX + getCurDate(), userId);
        if (isSign) {
            return String.format("用户【%d】今日已签到", userId);
        }
        return String.format("用户【%d】今日尚未签到，请签到", userId);
    }

    /**
     * 统计今天所有的签到数量
     */
    @GetMapping("/todayCount")
    public String todayCount() {
        return String.format("今日已签到人数: %d", redisService.bitCount(SIGN_PREFIX + getCurDate()));
    }

    /**
     * 统计指定用户全年的签到数
     */
    @GetMapping("/userYearSign/{userId}")
    public String userYearSign(@PathVariable Long userId) {
        int year = LocalDate.now().getYear();
        // 获取所有的key
        Set<String> keys = redisService.getKeys(SIGN_PREFIX + year + "*");
        /*
         * 可以使用BitSet 去存储用户每天的签到信息，用于其他的操作
         * BitSet users = new BitSet();
         * 统计所有已经签到的数量 对应 redis的bitCount
         * users.cardinality()
         */
        int signCount = 0;
        for (String key : keys) {
            if (redisService.getBit(key, userId)) {
                signCount++;
            }
        }
        return String.format("本年已累计签到： %d 次", signCount);
    }

    /**
     * 统计近7天连续签到的用户数量
     * 逻辑与
     */
    @GetMapping("/signAllWeek")
    public String signAllWeek() {
        List<String> weekDays = getWeekKeys();
        redisService.bitOp(RedisStringCommands.BitOperation.AND, SIGN_ALL_WEEK_KEY, weekDays);
        return String.format("近7天连续签到用户数：%d", redisService.bitCount(SIGN_ALL_WEEK_KEY));
    }

    /**
     * 统计本月全部签到过的用户数量
     */
    @GetMapping("/signAllMonth")
    public String signAllMonth() {
        redisService.bitOp(
                RedisStringCommands.BitOperation.AND,
                SIGN_ALL_MONTH_KEY,
                SIGN_PREFIX + LocalDate.now().getYear()
        );
        return String.format("月全部签到过的用户数：%d", redisService.bitCount(SIGN_ALL_MONTH_KEY));
    }

    /**
     * 统计近7天有过签到的用户数量，只签到1次也算
     * 逻辑或
     */
    @GetMapping("/signInWeek")
    public String signInWeek() {
        List<String> weekDays = getWeekKeys();
        redisService.bitOp(RedisStringCommands.BitOperation.OR, SIGN_IN_WEEK_KEY, weekDays);
        return String.format("近7天有过签到的用户数：%d", redisService.bitCount(SIGN_IN_WEEK_KEY));
    }

    /**
     * 获取当天的日期
     *
     * @return yyyyMMdd
     */
    private String getCurDate() {
        return LocalDate.now().format(formatters);
    }

    /**
     * 获取近一周的日期对应的key
     */
    private List<String> getWeekKeys() {
        List<String> dateList = new ArrayList<>();
        LocalDate curDate = LocalDate.now();
        dateList.add(SIGN_PREFIX + curDate.format(formatters));
        for (int i = 1; i < 7; i++) {
            dateList.add(SIGN_PREFIX + curDate.plusDays(-i).format(formatters));
        }
        return dateList;
    }
}
```
#### 补充
* 上述例子中我们默认用户ID是数字类型，如果你们的用户ID是字符串的，那么可以将用户ID作为key，取当天是今年的第几天作为偏移量，这样一天记录就是一个人全年的签到记录；
* 在进行BITOP操作时会重新生成一个结果的key，可以在每天凌晨通过定时任务去统计之前的记录来生成这个结果key，这样在业务中就可以直接通过这个结果key来统计数据



作者：俞大仙
链接：https://juejin.cn/post/6844904049909694477
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
