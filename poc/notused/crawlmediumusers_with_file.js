//======================================================================================
//  MEDIUM CRAWLER
//======================================================================================
const urlCounterMemLimit = 10000;
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

    async.mapLimit(urls, 50, loadURLAsync, function(err, results) {
        console.log("Loading Ended" + results.length + " url:" + urls.length);
        if (results.length == urls.length) {
            console.log("Processed HTTP Count " + results.length);

            var statusObj = getMemStatus();
            if (statusObj.urlCount < urlCounterMemLimit) {
                processUserQueue();
            } else {
                freeCrawlerMem();
            }

        }
        if (err != null) console.log(err);
    });

}

function loadURLAsync(url, doneCallback) {

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
                    }

                    if (jContent.payload.paging.next.to == undefined) { //Last Paging
                        //Status..
                        console.log("UserId Followings Finished: " + uModel.userId);
                    } else {
                        //Next Paging To..
                        var uModelNextPage = { userId: uModel.userId, status: false, name: user.name, username: user.username };
                        uModelNextPage.pagingTo = jContent.payload.paging.next.to;
                        uModelNextPage.url = generateURL(newUModel);
                        newUserNextPageURLKey = encodeURI(uModelNextPage.url);
                        if (userQueue[newUserNextPageURLKey] == undefined) {
                            userQueue[newUserNextPageURLKey] = uModelNextPage;
                        } else {
                            //console.log("next page exist in queue: "+ newUserNextPageURLKey);
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


//============ CRAWLER MEMORY OPERATION ===========================================

var mapOfMediumUserInMem = {};

function freeCrawlerMem() {
    var uModel = null;
    for (var key in userQueue) {
        uModel = userQueue[key];
        mapOfMediumUserInMem[uModel.userId] = { userId: uModel.userId, existInFile: false, name: uModel.name }
    }
    checkFilesForUserIdProcessedAndTriggerCrawlerAgain(uModel.userId, uModel.name);
}


function getMediumUsersInMem() {
    var arr = []
    for (key in mapOfMediumUserInMem) {
        arr.push(mapOfMediumUserInMem[key]);
    }
    return arr;
}


//============FILESYS OPERATION ===========================================

var fs = require('fs');
var stream;
var fileItemLimit = 50000;
var mapFileName = {};




//======================================================

function getNotProcessFile() {
    for (key in mapFileName) {
        var obj = mapFileName[key];
        if (!obj.loaded) {
            return obj;
        }
    }

    return { filePath: null };
}

//======================================================
function readOutputs(txtDirPath, searchKeys, fn) {

    fs.readdir(txtDirPath, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        console.log(filenames.length);
        for (var i = 0; i < filenames.length; i++) {
            var filename = filenames[i];
            isValid = filename.includes("key");
            if (isValid) {
                var filePath = txtDirPath + filename;
                const stats = fs.statSync(filePath)
                const fileSizeInBytes = stats.size
                console.log(filePath + ":" + fileSizeInBytes);
                mapFileName[filePath] = { filePath: filePath, loaded: false };
            }
        }

        //End Of File
        streamRead(getNotProcessFile().filePath, searchKeys, fn);

    });
}

//======================================================
function streamRead(filename, searchKeys, fn) {
    if (filename == null) {
        fn();
    } else {
        fs.readFile(filename, 'utf8', function(err, data) {
            if (err) throw err;
            mapFileName[filename].loaded = true;
            console.log('OK: ' + filename);
            searchKeys.forEach(function(elem) {
                if (data.includes(elem.userId)) {
                    elem.existInFile = true;
                    console.log("find in file:" + filename + " searchKey:" + elem.userId);
                }
            });
            streamRead(getNotProcessFile().filePath, searchKeys, fn);
        });
    }
}

//======================================================

function getFileCounter() {
    var counter = 0;
    for (key in mapFileName) counter++;
    return counter;
}


function writeOutputs(txtFilePathOrigin, fn) {
    streamWrite(txtFilePathOrigin, fn)
}


function streamWrite(filename, fn) {
    // Open stream
    var realFileName = filename + getFileCounter();
    var stream = fs.createWriteStream(realFileName);
    for (key in mapOfMediumUserInMem) {
        var uModel=mapOfMediumUserInMem[key]
        stream.write(uModel.userId + " "+ uModel.name + " ");
    }

    // Create event when stream is closed
    stream.end(function() {
        fn(realFileName);
    });
}

//=============
function checkFilesForUserIdProcessedAndTriggerCrawlerAgain(lastUserId, lastName) {
    readOutputs("outputs/", getMediumUsersInMem(), function() {
        console.log("All File Processed");
        for (key in mapOfMediumUserInMem) {
            if (mapOfMediumUserInMem[key].existInFile) delete mapOfMediumUserInMem[key];
        }
        console.log("Prev Deleted Item Removed Map");


        var counterOfItemInMem = 0;
        for (key in mapOfMediumUserInMem) { counterOfItemInMem++; }
        writeOutputs("outputs/key", function(filename) {
            console.log('Completed writing: ' + filename);
            userQueue = {}
            console.log("Root:" + lastUserId + " name:" + lastName);
            crawl(lastUserId, lastName);
        });


    });
}




console.log("Welcome to Medium Crawler");
crawl("67ea4f73fc7", "Onur Dayibasi")