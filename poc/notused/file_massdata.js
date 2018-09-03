var fs = require('fs');

var stream;
var counter = 0;
var streamLimit = 1000000;
var value, key;
var mapFileName = {};

// //======================================================
// function readOutputs(txtDirPath, searchKey, fn) {

//     fs.readdir(txtDirPath, function(err, filenames) {
//         if (err) {
//             onError(err);
//             return;
//         }
//         console.log(filenames.length);
//         for (var i = 0; i < filenames.length; i++) {
//             var filename = filenames[i];
//             isValid = filename.includes("key");
//             if (isValid) {
//                 var filePath = txtDirPath + filename;
//                 const stats = fs.statSync(filePath)
//                 const fileSizeInBytes = stats.size
//                 console.log(filePath + ":" + fileSizeInBytes);
//                 streamRead(filePath, searchKey,fn);
//             }
//         }
//     });

// }


// function streamRead(filename, searchKey, fn) {
//     fs.readFile(filename, 'utf8', function(err, data) {
//         if (err) throw err;
//         console.log('OK: ' + filename);
//         if (data.includes("k15000338")) {
//             fn(filename, searchKey);
//         }
//     });
// }


// //streamRead("outputs/key15");
// readOutputs("outputs/", "k15000338", function(filename, searchKey) {
//     console.log("find in file:"+filename + " searchKey:"+searchKey);
// });



var fs = require('fs');
var stream;
var counter = 0;
var streamLimit = 1000000;


function streamWrite(filename) {
    // Open stream
    var realFileName = filename + counter
    var stream = fs.createWriteStream(realFileName);
    for (var record = 0; record < streamLimit; record++) {
        var code = counter * streamLimit + record
        var key = 'k' + code + " ";
        stream.write(key);
    }

    // Create event when stream is closed
    stream.end(function() {
        counter++;
        console.log('Completed!' + counter + " key: " + key);
        if (counter < 100) streamWrite(filename);
        else console.log("Finished");
    });
}

streamWrite("outputs/key");