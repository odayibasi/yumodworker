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
    console.log("Welcome to Medium UserInfo Crawler");
    queryAllUsersWithPaging({ paging: 0, limit: 100 });


}); //Connect


function queryAllUsersWithPaging(conf) {

    userIDMAp = {};
    var sqlTemp = "SELECT * from USR LIMIT $limit OFFSET $offset";
    var sql = sqlTemp.replace("$offset", conf.paging * conf.limit).replace("$limit", conf.limit);
    con.query(sql, function(err, result) {
        if (err) throw err;
        if (Array.isArray(result) && result.length > 0) {
            result.forEach((elem, index) => {
                urlTemp = "https://medium.com/_/api/users/$userId/profile";
                elem.url = urlTemp.replace("$userId", elem.USR_ID);
                console.log(elem.url);
            });
            crawlAllUsers(conf, result);

        } else {
            console.log("Result Not Exist:" + userIDSet.length);
        }

    });
}





//=====String Functions=======================================================
String.prototype.validSQLChar = function() {
    var target = this;
    return target.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ._@-]/g, " ");
}


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


//======================================================================================
//  MEDIUM USER INFO CRAWLER
//======================================================================================
var async = require('async');
var request = require('request');



function crawlAllUsers(conf, usrs) {

    async.mapLimit(usrs, 100, loadURLAsync, function(err, results) {
        if (err != null) console.log(err);
        conf.paging++;
        queryAllUsersWithPaging(conf);

    });

}

function loadURLAsync(elem, doneCallback) {
    //console.log("url:" + url);
    request(elem.url, function(error, response, html) {
        // First we'll check to make sure no errors occurred when making the request
        if (!error) {
            var content = html.substring(16);
            try {
                var jContent = JSON.parse(content);
                var user = jContent.payload.user;
                var yUsr = {};
                yUsr.userId = user.userId;
                yUsr.name = user.name;
                yUsr.username = user.username;
                yUsr.bio = user.bio;
                yUsr.lastPostCreatedAt = user.lastPostCreatedAt;
                yUsr.twitterScreenName = user.twitterScreenName;
                yUsr.facebookAccountId = user.facebookAccountId;
                yUsr.createdAt = user.createdAt;

                var userMeta = jContent.payload.userMeta;
                yUsr.numberOfPostsPublished = userMeta.numberOfPostsPublished;

                var socialMap = jContent.payload.references.SocialStats;
                var social = socialMap[yUsr.userId];
                yUsr.usersFollowedByCount = social.usersFollowedByCount;
                updateData(yUsr, doneCallback)

            } catch (e) {
                console.log("Content Problem:" + e);
                return doneCallback(null, { url: elem.url });
            }
        }
    });
}


function updateData(yUsr, doneCallback) {

    var sqlTemp = "UPDATE USR SET USR_NAME='$username', NUMBER_OF_POST_PUBLISHED=$numberOfPostsPublished , USERS_FOLLOWED_BY_COUNT=$usersFollowedByCount WHERE  USR_ID='$userId'";
    sql = sqlTemp.replace("$userId", yUsr.userId)
        .replace("$username", yUsr.username)
        .replace("$numberOfPostsPublished", yUsr.numberOfPostsPublished)
        .replace("$usersFollowedByCount", yUsr.usersFollowedByCount);

    con.query(sql, function(err, result) {
        if (err) throw err;
        return doneCallback(null, { succeed: true });
    });



}