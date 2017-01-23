var mysqlPool2 = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'lw123',
    database: 'test',
    waitForConnections: true
});

function insertPlayerData(query, cb) {
    var _sql = "insert into orders(order_num, order_date, cust_id) values ?";
    var values = [[20012, '2016-02-12 12:01:15', 10001], [2013, '2016-02-12 12:01:15', 10002], [20014, '2016-02-12 12:01:15', 10003]];
   mysqlPool2.query(_sql, [values], function(err, result){
        if(err || !result.affectedRows < 0){
            console.log("错误信息：", err);
            cb(err, null);
        }else{
            cb(null);
        }
    })
}

exports.insertPlayerData = insertPlayerData;
