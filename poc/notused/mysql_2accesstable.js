var mysql = require('mysql');

var con = mysql.createConnection({
    host: "54.215.250.111",
    database: "medium_lookup",
    user: "root",
    password: "123456Ab",
    port: "3306"
});



con.connect(function(err) {

    if (err) throw err;
    console.log("Connected!");
    insertURL({url:"aaa", name:"bbb",userId:"cccc"});


}); //Connect




function insertURL(uModel) {
    var sqlTemp = "INSERT INTO USR_URLS (USR_URL, USR_NAME, USR_ID) VALUES ('$url', '$name','$userId')";
    var sql = sqlTemp.replace("$url", uModel.url).replace("$name", uModel.name).replace("$userId", uModel.userId);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("item inserted");
    });
}