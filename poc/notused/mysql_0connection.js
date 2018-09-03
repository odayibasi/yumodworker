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
}); //Connect