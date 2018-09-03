const async = require("async");
const fs = require("fs");

function testAsyncConcat() {

    async.concat(['poc', 'outputs', 'service'], fs.readdir, function(err, files) {
        files.forEach(elem => console.log(elem));
    });

    async.concat(['poc', 'outputs', 'service2'], fs.readdir, function(err, files) {
        if (err != null) {
            console.log("Err:" + err);
            return;
        }
        files.forEach(elem => console.log(elem));
    });
}


//testAsyncConcat();


//======GLOBAL SCOPE =============
scopeTest();

console.log(a);
//console.log(b);
console.log(c);

function scopeTest() {

    a = "A";
    var b = "B";
    let c = "C"
    console.log(a);
    console.log(b);
    console.log(c);

}