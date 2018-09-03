//============ CRAWLER MEMORY OPERATION ===========================================

var mapOfMediumUserInMem = {};


function crawlTest0() {
    mapOfMediumUserInMem["k15000338"] = { userId: "k15000338", existInFile: false }
    mapOfMediumUserInMem["k15000291"] = { userId: "k15000291", existInFile: false }
    mapOfMediumUserInMem["k800002AA"] = { userId: "k800002AA", existInFile: false }
    mapOfMediumUserInMem["k97000302"] = { userId: "k97000302", existInFile: false }
    mapOfMediumUserInMem["k80000219"] = { userId: "k80000219", existInFile: false }
}

function crawlTest1() {
    mapOfMediumUserInMem["k800004AA"] = { userId: "k800004AA", existInFile: false }
    mapOfMediumUserInMem["k97000402"] = { userId: "k97000402", existInFile: false }
    mapOfMediumUserInMem["k15000438"] = { userId: "k15000438", existInFile: false }
    mapOfMediumUserInMem["k80000420"] = { userId: "k80000420", existInFile: false }
    mapOfMediumUserInMem["k80000423"] = { userId: "k80000423", existInFile: false }

}


var crawlCounter = 0;

function crawlTest() {
    var cmd = "crawlTest" + crawlCounter + "()"
    if (crawlCounter<2) {
        eval(cmd);
        crawlCounter++;
        checkFilesForUserIdProcessedAndTriggerCrawlerAgain();
    }
}




function crawl(){
    crawlTest();
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
var fileItemLimit = 3;
var mapFileName = {};

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
        stream.write(key + " ");
    }

    // Create event when stream is closed
    stream.end(function() {
        fn(realFileName);
    });
}

//=============
function checkFilesForUserIdProcessedAndTriggerCrawlerAgain() {
    readOutputs("outputs/", getMediumUsersInMem(), function() {
        console.log("All File Processed");
        for (key in mapOfMediumUserInMem) {
            if (mapOfMediumUserInMem[key].existInFile) delete mapOfMediumUserInMem[key];
        }
        console.log("Prev Deleted Item Removed Map");


        var counterOfItemInMem = 0;
        for (key in mapOfMediumUserInMem) { counterOfItemInMem++; }
        if (counterOfItemInMem >= fileItemLimit) {
            writeOutputs("outputs/key", function(filename) {
                console.log('Completed writing: ' + filename);
                crawl();
            });
        } else {
            crawl();
        }

    });
}


crawl();