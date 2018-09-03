//======================================================================================
//  MYSQL CONNECTION
//======================================================================================

var host = "127.0.0.1";
process.argv.forEach(function(val, index, array) {
    if (val == "remote") host = "54.215.250.111";
});



var mysql = require('mysql');
var con = mysql.createConnection({
    host: host,
    database: "medium_lookup",
    user: "root",
    password: "123456Ab",
    port: "3306"
});


con.connect(function(err) {

    if (err) throw err;
    console.log("Connected MySQL DB");
    queryAllXML({ paging: 0, limit: 1000 });

}); //Connect



var userIDMAp = {};

function queryAllUserULRs(conf) {

    userIDMAp = {};
    var sqlTemp = "SELECT * from USR_URLS LIMIT $limit OFFSET $offset";
    var sql = sqlTemp.replace("$offset", conf.paging * conf.limit).replace("$limit", conf.limit);
    con.query(sql, function(err, result) {
        if (err) throw err;
        if (Array.isArray(result) && result.length > 0) {
            result.forEach((elem, index) => {
                userIDMAp[elem.USR_ID] = elem;
            });
            persistAllUsrs(conf);

        } else {
            console.log("Result Not Exist:" + userIDSet.length);
        }

    });
}


var async = require('async');

function persistAllUsrs(conf) {

    var usrs = [];
    for (key in userIDMAp) {
        usrs.push(userIDMAp[key]);
    }

    console.log("length:" + usrs.length);

    async.mapLimit(usrs, 100, insertUsrInfo, function(err, results) {
        if (err != null) console.log(err);
        conf.paging++;
        console.log("Paging:" + conf.paging);
        queryAllUserULRs(conf);
    });

}



function insertUsrInfo(elem, doneCallback) {
    var sqlTemp = "INSERT INTO USR (USR_ID, USR_FULLNAME) VALUES ('$usrId', '$usrname')";
    var sql = sqlTemp.replace("$usrId", elem.USR_ID).replace("$usrname", elem.USR_NAME);
    con.query(sql, function(err, result) {
        if (!err) {}
        return doneCallback(null, true);

    });
}