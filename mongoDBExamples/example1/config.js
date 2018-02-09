/**
 * Created by liwei04 on 2016/8/9.
 */
var config = {
    gameReportMongo: {
        //用户游戏报表数据库
        host: "115.159.83.62",
        "user": "",
        "pass": "",
        port: 27017,
        database: "gameReport"
    },
    gameInfoMongo: {
        //游戏局信息数据库
        "host": "115.159.52.252",
        "user": "acmoba",
        "pass": "acmoba",
        "port": 27017,
        "database": "greport"
    }
};


module.exports = config;
