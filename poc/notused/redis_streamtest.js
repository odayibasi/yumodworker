var redis = require('redis-stream'),
    client = new redis(6379, '127.0.0.1');

var stream;
var counter = 0;
var streamLimit = 100000;
var value,key;

function streamWrite() {
    stream = client.stream();
    for (var record = 0; record < streamLimit; record++) {
        var code=counter * streamLimit + record
        value = 'v-' +code;
        key = 'k-' +code;
        var command = ['set', key, value];
        stream.redis.write(redis.parse(command));
    }

    stream.end();
    stream.on('close', function() {
        counter++;
        console.log('Completed!' + counter + "key: " + key);
        if (counter < 100) streamWrite();
        else console.log("Finished");
    });
}

streamWrite();