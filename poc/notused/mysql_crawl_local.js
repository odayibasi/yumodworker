//======================================================================================
//  MYSQL CONNECTION
//======================================================================================


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
    console.log("Connected MySQL DB");
    console.log("Welcome to Medium Crawler");
    crawl("67ea4f73fc7", "Onur Dayibasi")

}); //Connect






//=====Lookup UModels=======================================================



function lookupUModels() {

    var uModel = getLookupItem();

    if (uModel == null) {
        persistUModels();
        return;
    }

    var sqlTemp = "SELECT * from USR_URLS WHERE USR_URL='$url'";
    var sql = sqlTemp.replace("$url", uModel.url);
    //console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        if (Array.isArray(result) && result.length > 0) {
            console.log("Result Exist:" + uModel.name);
            uModel.isExistInDB = true;
            lookupUModels();
        } else {
            console.log("Result Not Exist:" + uModel.name);
            uModel.isExistInDB = false;
            lookupUModels();
        }
    });
}


function printLookupItemStatus() {

    var all = processed = notProcessed = 0;
    for (var key in userQueue) {
        var uModel = userQueue[key]
        all++;
        if (uModel.isExistInDB == undefined) notProcessed++;
    }

    processed = all - notProcessed;
    console.log("all item: %d processed: %d notProcessed: %d", all, processed, notProcessed);
}


function getLookupItem() {

    printLookupItemStatus();
    for (var key in userQueue) {
        var uModel = userQueue[key]
        if (uModel.isExistInDB == undefined)
            return uModel;
    }

    return null;
}


function lookupUserQueue() {
    for (var key in userQueue) {
        var uModel = userQueue[key];
        uModel.isExistInDB = undefined;
    }
    lookupUModels();
}



//=====Persit UModels=======================================================
function persistUModels() {

    var uModel = getPersistItem();

    if (uModel == null) {
        console.log("Persist is finised");
        return;

    }

    if (uModel.url == undefined || uModel.name == undefined || uModel.userId == undefined) {
        console.log("Something undefined in Model");
        uModel.persist = true;
        persistUModels();
    }


    if (uModel.url == null || uModel.name == null || uModel.userId == null) {
        console.log("Something null in Model");
        uModel.persist = true;
        persistUModels();
    }


    uModel.name = uModel.name.validSQLChar();

    var sqlTemp = "INSERT INTO USR_URLS (USR_URL, USR_NAME, USR_ID) VALUES ('$url', '$name','$userId')";
    var sql = sqlTemp.replace("$url", uModel.url).replace("$name", uModel.name).replace("$userId", uModel.userId);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("item inserted:" + uModel.name);
        uModel.isPersist = true;
        persistUModels();
    });

}


function getPersistItem() {

    for (var key in userQueue) {
        var uModel = userQueue[key]
        if (!uModel.isExistInDB)
            return uModel;
    }

    return null;
}




//=====Update UModels=======================================================


function updateUModels() {

    var uModel = getUpdateItem();

    if (uModel == null) {
        console.log("Updated is finised");
        return;
    }

    if (uModel.url == undefined || uModel.name == undefined || uModel.userId == undefined) {
        console.log("Something undefined in Model");
        uModel.persist = true;
        persistUModels();
    }


    if (uModel.url == null || uModel.name == null || uModel.userId == null) {
        console.log("Something null in Model");
        uModel.persist = true;
        persistUModels();
    }


    uModel.name = uModel.name.validSQLChar();

    var sqlTemp = "UPDATE INTO USR_URLS (USR_URL, USR_NAME, USR_ID) VALUES ('$url', '$name','$userId')";
    var sql = sqlTemp.replace("$url", uModel.url).replace("$name", uModel.name).replace("$userId", uModel.userId);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("item inserted:" + uModel.name);
        uModel.isPersist = true;
        persistUModels();
    });

}




function getUpdateItem() {

    for (var key in userQueue) {
        var uModel = userQueue[key]
        if (!uModel.status)
            return uModel;
    }
    return null;
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
//  MEDIUM CRAWLER
//======================================================================================
var async = require('async');
var request = require('request');

var userQueue = {};
var hrstart = null;
hrstart = process.hrtime();


function getMemStatus() {

    var userCounter = 0;
    var urlCounter = 0;
    var pUrlCounter = 0;
    var uMap = {};
    for (var key in userQueue) {
        urlCounter++;
        var uModel = userQueue[key];
        if (uModel.status) pUrlCounter++;
        uMap[uModel.userId] = true;
    }

    for (var key in uMap) {
        userCounter++
    }

    var hrend = process.hrtime(hrstart);
    console.info("Execution time (hr): %ds %dms  UserCount:%d UrlCount:%d pUrlCounter:%d", hrend[0], hrend[1] / 1000000, userCounter, urlCounter, pUrlCounter);
    return { userCount: userCounter, urlCount: urlCounter, processedURLCount: pUrlCounter };
}


function generateURL(uModel) {

    var pagingTo = uModel.pagingTo != undefined ? "&to=" + uModel.pagingTo : "";
    var urlTemp = "https://medium.com/_/api/users/$userId/profile/stream?source=following&limit=100$pagingTo";
    var url = urlTemp.replace("$userId", uModel.userId).replace("$pagingTo", pagingTo);
    return url;
}


function processUserQueue() {

    var urls = [];
    for (key in userQueue) {
        var uModel = userQueue[key];
        if (!uModel.status) {
            urls.push(uModel.url);
        }
    }

    if (urls.length <= 0) return;


    async.mapLimit(urls, 50, loadURLAsync, function(err, results) {
        console.log("Loading Ended" + results.length + " url:" + urls.length);
        var statusObj = getMemStatus();
        if (urls.length <= 1) {
            processUserQueue();
        } else {
            lookupUserQueue();
        }
        if (err != null) console.log(err);
    });



}

function loadURLAsync(url, doneCallback) {
    //console.log("url:" + url);
    request(url, function(error, response, html) {
        // First we'll check to make sure no errors occurred when making the request
        if (!error) {
            var queueKey = encodeURI(url);
            var uModel = userQueue[queueKey];
            if (uModel != undefined) {

                //console.log(queueKey + " exist in userQueue");
                uModel.status = true; //Link Loaded...

                var content = html.substring(16);
                try {
                    var jContent = JSON.parse(content);
                    var userMap = jContent.payload.references.User;

                    for (key in userMap) {
                        var user = userMap[key];
                        var newUModel = { userId: user.userId, status: false, name: user.name, username: user.username };
                        newUModel.url = generateURL(newUModel);
                        var newUserURLKey = encodeURI(newUModel.url);
                        if (userQueue[newUserURLKey] == undefined) {
                            userQueue[newUserURLKey] = newUModel;
                        } else {
                            //console.log("user exist in queue: "+ newUserURLKey);
                        }
                        //break;
                    }

                    if (jContent.payload.paging.next.to == undefined) { //Last Paging
                        //Status..
                        console.log("UserId Followings Finished: " + uModel.name + " userId:" + uModel.userId);
                    } else {
                        //Next Paging To..
                        var uModelNextPage = { userId: uModel.userId, status: false, name: user.name, username: user.username };
                        uModelNextPage.pagingTo = jContent.payload.paging.next.to;
                        uModelNextPage.url = generateURL(newUModel);
                        newUserNextPageURLKey = encodeURI(uModelNextPage.url);
                        if (userQueue[newUserNextPageURLKey] == undefined) {
                            userQueue[newUserNextPageURLKey] = uModelNextPage;
                        } else {
                            //console.log("next page exist in queue: " + newUserNextPageURLKey);
                        }
                    }
                } catch (e) {
                    //console.log("Content Problem:" + url);
                    //process.exit(0);
                }
            }

            //printStatus();
            //console.log("url loaded:" + url);
            return doneCallback(null, { url: url });

        }
    })
}

function crawl(userId, name) {

    var rootUModel = { userId: userId, status: false, name: name };
    rootUModel.url = generateURL(rootUModel);
    userQueue = {};
    userQueue[encodeURI(rootUModel.url)] = rootUModel;
    processUserQueue();
}