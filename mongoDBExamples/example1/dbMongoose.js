/**
 * Created by liwei04 on 2016/8/9.
 */
var mongoose = require('mongoose');    //引用mongoose模块
var config = require("./config.js");
var schemaMap = require("./schemaMap.js");

var testMongoose = new  mongoose.Mongoose();
var needModel = null;

var dataSchema = new testMongoose.Schema(schemaMap.playerdata);
needModel = testMongoose.model("mapPlayerData", dataSchema);
var gameInfoMongo = "gameInfoMongo";

function createMongoConnect() {
    connectMongoDB(testMongoose, gameInfoMongo);
}

function connectMongoDB(mongoose, dbConfig) {
    if (!mongoose.connections || !mongoose.connections.length || !mongoose.connections[0]._hasOpened) {
        var connectStr = getConnectURI(config[dbConfig]);
        //未连接 则打开连接
        mongoose.connect(connectStr, function (err) {
            if (err) {
                console.log(dbConfig + ",连接失败,", err);
            }
            else console.log(dbConfig + ",连接成功");
        });
    } else {
        console.log(dbConfig + ",连接已开启");
    }
}

function getConnectURI(configObj) {
    //构建mongouri
    var base = "mongodb://";
    var mongo_address = configObj.host, //"127.0.0.1:27017",
        mongo_user = configObj.user,
        mongo_pass = configObj.pass;
    var mongo_auth = "";
    if (mongo_user && mongo_pass && mongo_user != "" && mongo_pass != "") {
        mongo_auth = mongo_user + ":" + mongo_pass + "@";
    }
    base += mongo_auth + mongo_address + "/" + configObj.database;
    return base;
}

exports.createMongoConnect = createMongoConnect;
exports.mongoModel = needModel;
