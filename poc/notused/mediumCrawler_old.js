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
    console.log("Welcome to Medium Crawler");
    crawl("67ea4f73fc7", "Onur Dayibasi")

}); //Connect



//==== ExTRa Async Loading


// function loadURLAsync(uModel, doneCallback) {


//     var sqlTemp = "SELECT * from USR_URLS WHERE USR_URL='$url'";
//     var sql = sqlTemp.replace("$url", uModel.url);
//     //console.log(sql);
//     con.query(sql, function(err, result) {
//         if (err) throw err;
//         if (Array.isArray(result) && result.length > 0) {
//             console.log("Result Exist:" + uModel.name);
//             uModel.isExistInDB = true;
//             lookupUModels();
//         } else {
//             console.log("Result Not Exist:" + uModel.name);
//             uModel.isExistInDB = false;
//             lookupUModels();
//         }

//         return doneCallback(null, { data: uModel });

//     });


//     //console.log("url:" + url);
//     request(url, function(error, response, html) {
//         // First we'll check to make sure no errors occurred when making the request
//         if (!error) {
//             var queueKey = encodeURI(url);
//             var uModel = userQueue[queueKey];
//             if (uModel != undefined) {

//                 //console.log(queueKey + " exist in userQueue");
//                 uModel.status = true; //Link Loaded...

//                 var content = html.substring(16);
//                 try {
//                     var jContent = JSON.parse(content);
//                     var userMap = jContent.payload.references.User;

//                     for (key in userMap) {
//                         var user = userMap[key];
//                         var newUModel = { userId: user.userId, status: false, name: user.name, username: user.username };
//                         newUModel.url = generateURL(newUModel);
//                         var newUserURLKey = encodeURI(newUModel.url);
//                         if (userQueue[newUserURLKey] == undefined) {
//                             userQueue[newUserURLKey] = newUModel;
//                         } else {
//                             //console.log("user exist in queue: "+ newUserURLKey);
//                         }
//                         //break;
//                     }

//                     if (jContent.payload.paging.next.to == undefined) { //Last Paging
//                         //Status..
//                         console.log("UserId Followings Finished: " + uModel.name + " userId:" + uModel.userId);
//                     } else {
//                         //Next Paging To..
//                         var uModelNextPage = { userId: uModel.userId, status: false, name: user.name, username: user.username };
//                         uModelNextPage.pagingTo = jContent.payload.paging.next.to;
//                         uModelNextPage.url = generateURL(newUModel);
//                         newUserNextPageURLKey = encodeURI(uModelNextPage.url);
//                         if (userQueue[newUserNextPageURLKey] == undefined) {
//                             userQueue[newUserNextPageURLKey] = uModelNextPage;
//                         } else {
//                             //console.log("next page exist in queue: " + newUserNextPageURLKey);
//                         }
//                     }
//                 } catch (e) {
//                     //console.log("Content Problem:" + url);
//                     //process.exit(0);
//                 }
//             }

//             //printStatus();
//             //console.log("url loaded:" + url);
//             return doneCallback(null, { url: url });

//         }
//     })
// }



//=====Lookup UModels=======================================================
function lookupUModels() {

    var uModel = getLookupItem();

    if (uModel == null) {
        console.log("Lookup is finised");
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


// function lookupUserQueueAsync() {
//     var lookupArr = [];
//     for (var key in userQueue) {
//         var uModel = userQueue[key];
//         uModel.isExistInDB = undefined;
//         lookupArr.push(uModel);
//     }


//     lookupUModels();
// }


//=====Persit UModels=======================================================
function persistUModels() {

    var uModel = getPersistItem();

    if (uModel == null) {
        console.log("Persist is finised");
        updateUModels();
        return;

    }

    if (uModel.url == undefined || uModel.name == undefined || uModel.userId == undefined) {
        console.log("Something undefined in Model");
        uModel.isExistInDB = true;
        persistUModels();
    }


    if (uModel.url == null || uModel.name == null || uModel.userId == null) {
        console.log("Something null in Model");
        uModel.isExistInDB = true;
        persistUModels();
    }


    uModel.name = uModel.name.validSQLChar();

    var sqlTemp = "INSERT INTO USR_URLS (USR_URL, USR_NAME, USR_ID, URL_STAT) VALUES ('$url', '$name','$userId',$status)";
    var sql = sqlTemp.replace("$url", uModel.url).replace("$name", uModel.name).replace("$userId", uModel.userId).replace("$status", uModel.status);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("item inserted:" + uModel.name);
        uModel.isExistInDB = true;
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
        crawlFindRootURL()
        return;
    }

    if (uModel.url == undefined || uModel.name == undefined || uModel.userId == undefined) {
        console.log("Something undefined in Model");
        uModel.status = false;
        updateUModels();
    }


    if (uModel.url == null || uModel.name == null || uModel.userId == null) {
        console.log("Something null in Model");
        uModel.status = false;
        updateUModels();
    }


    uModel.name = uModel.name.validSQLChar();

    var sqlTemp = "UPDATE USR_URLS SET URL_STAT=$stat WHERE  USR_URL='$url'";
    sql = sqlTemp.replace("$stat", uModel.status).replace("$url", uModel.url);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("item updated:" + uModel.name);
        uModel.status = false;
        updateUModels();
    });

}

function getUpdateItem() {

    for (var key in userQueue) {
        var uModel = userQueue[key]
        if (uModel.status)
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

    if (urls.length <= 0) {
        console.log("There is not URL to Crawl, Persist And Start Again");
        uModel.status = true;
        console.log("Persist:" + urls.length);
        lookupUserQueue();
        return;
    }


    async.mapLimit(urls, 50, loadURLAsync, function(err, results) {
        console.log("Loading Ended" + results.length + " url:" + urls.length);
        var statusObj = getMemStatus();
        if (urls.length <= 1) {
            console.log("Crawl Url:" + urls[0]);
            processUserQueue();
        } else {
            console.log("Persist:" + urls.length);
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
                            console.log("user exist in queue: " + newUserURLKey);
                        }

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
                            console.log("next page exist in queue: " + newUserNextPageURLKey);
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


function crawlRootURL(rootUModel) {

    crawlStats(function() {
        userQueue = {};
        userQueue[encodeURI(rootUModel.url)] = rootUModel;
        processUserQueue();
    });
}


function crawl(userId, name) {

    var rootUModel = { userId: userId, status: false, name: name };
    rootUModel.url = generateURL(rootUModel);
    crawlRootURL(rootUModel);

}


function crawlFindRootURL() {
    var sql = "SELECT * from USR_URLS where URL_STAT=0 LIMIT 1";
    con.query(sql, function(err, result) {
        if (err) throw err;
        if (Array.isArray(result) && result.length > 0) {
            console.log("Result Exist:");
            var row = result[0];
            var rootUModel = { userId: row.USR_ID, status: false, name: row.USR_NAME, url: row.USR_URL };
            crawlRootURL(rootUModel);
        } else {
            console.log("Result Not Exist:");
        }
    });
}



function crawlStats(callback) {
    var sql = "SELECT count(*) as cnt from USR_URLS";
    con.query(sql, function(err, result) {
        if (err) throw err;
        var hrend = process.hrtime(hrstart);

        console.log("=================STATS==============\n");
        console.log("Count:" + JSON.stringify(result));
        console.log("Execution time (hr): %ds %dms  ", hrend[0], hrend[1] / 1000000);
        console.log("====================================\n");
        process.exit(0);
        //callback();
    });

}