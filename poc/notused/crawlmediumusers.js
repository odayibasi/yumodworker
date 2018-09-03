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
        if (results.length == urls.length) {
            //console.log("Processed HTTP Count " + results.length);
            var statusObj = getMemStatus();
            processUserQueue();

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
    userQueue[encodeURI(rootUModel.url)] = rootUModel;
    processUserQueue();
}



console.log("Welcome to Medium Crawler");
crawl("67ea4f73fc7", "Onur Dayibasi")