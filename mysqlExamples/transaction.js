var mysql = require('mysql');
var node_pool = require('generic-pool');
var async = require('async');

var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'lw123',
    database: 'ad_logs',
    waitForConnections: true
});

function getSqlsAndParams(sql, params, callback) {
    if (callback) {
        return callback(null, {
            sql: sql,
            params: params
        });
    }
    return {
        sql: sql,
        params: params
    };
}

var example = "hsfhsu";

function execTrans(sqlparamsEntities, callback) {
    mysqlPool.getConnection(function (err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                return callback(err, null);
            }
            console.log("开始事务处理，共执行" + sqlparamsEntities.length + "条数据");
            var funcAry = [];
            sqlparamsEntities.forEach(function (sql_param) {
                var tempFunc = function (cb) {
                    var sql = sql_param.sql;
                    var param = sql_param.params;
                    connection.query(sql, param, function (tErr, rows, fields) {
                        if (tErr) {
                            connection.rollback(function () {
                                console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                                throw tErr;
                            });
                        } else {
                            return cb(null, 'ok');
                        }
                    })
                };
                funcAry.push(tempFunc);
            });

            async.series(funcAry, function (err, result) {
                console.log("transaction error: " + err);
                if (err) {
                    connection.rollback(function (err) {
                        console.log("transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                    connection.commit(function (err, info) {
                        console.log("transaction info: " + JSON.stringify(info));
                        if (err) {
                            console.log("执行事务失败，" + err);
                            connection.rollback(function (err) {
                                console.log("transaction error: " + err);
                                connection.release();
                                return callback(err, null);
                            });
                        } else {
                            connection.release();
                            return callback(null, info);
                        }
                    })
                }
            })
        });
    });
}

function doQueryAction(orgs, callback) {
    var sqlParamsEntity = [];
    var sql1 = "insert table set a=?, b=? where 1=1";
    var param1 = {a:1, b:2};

    sqlParamsEntity.push(getSqlsAndParams(sql1, param1));

    var sql2 = "update ...";
    sqlParamsEntity.push(getSqlsAndParams(sql1, []));

    execTrans(sqlParamsEntity, function () {

    });
}

exports.doQueryAction = doQueryAction;
