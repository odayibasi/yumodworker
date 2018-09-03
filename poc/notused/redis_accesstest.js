console.log("redis test");
var redis = require('redis');
var port="6379";
var host="54.183.30.216"
var client = redis.createClient(port,host); //creates a new client

client.on('connect', function() {
    console.log('connected');
});

client.on("error", function (err) {
    console.log("Error " + err);
});



client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});