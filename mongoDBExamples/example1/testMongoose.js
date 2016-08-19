/**
 * Created by liwei04 on 2016/8/9.
 */

var mongooseClient = require("../helpers/dbMongoose.js");

mongooseClient.createMongoConnect();
var playerModel = mongooseClient.mongoModel;


/**
 * 根据uid获取玩家的有效局
 *
 * @param userId
 * @param callBack
 */
function getValidBattles(userId, callBack) {
    var query = {
        "PlayerID": userId,
        "GameMode": 0
    };
    playerModel.find(query, function (err, docs) {
        if (err) {
            callBack("fail");
        } else {
            var count = 0;
            if (Array.isArray(docs)) {
                docs.forEach(function (item) {
                    if (item.GameResult === 2 || item.GameResult === 3) {
                        count += 1;
                    }
                });
            }

            callBack("success");
        }

    });

}

function getNeedPlayerData(userId, callBack) {
    var query = {
        "PlayerID": userId
    };

    playerModel.find(query).sort({"GameStartTime": -1}).limit(50).exec(function (err, result) {
        if (err) {
            console.log("获取玩家最后50局战报失败");
            console.log(err);
            return callBack(null);
        } else {
            var gameReports = [];
            if (result && result.length > 0) {
                for (var index = 0, leng = result.length; index < leng; index++) {
                    gameReports.push(result[index]._doc);
                }
            }

            return callBack(gameReports);
        }
    });
}



exports.getValidBattles = getValidBattles;
exports.getNeedPlayerData = getNeedPlayerData;
