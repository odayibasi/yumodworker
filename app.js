var port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    html = fs.readFileSync('index.html');

var log = function(entry) {
    fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n');
};

//Listen SQS
var server = http.createServer(function(req, res) {
    if (req.method === 'POST') {
        var body = '';

        req.on('data', function(chunk) {
            body += chunk;
        });

        req.on('end', function() {
            if (req.url === '/') {
                log('Received URL: ' + body);
                loadURL(body);
            } else if (req.url = '/scheduled') {
                log('Received task ' + req.headers['x-aws-sqsd-taskname'] + ' scheduled at ' + req.headers['x-aws-sqsd-scheduled-at']);
            }

            res.writeHead(200, 'OK', { 'Content-Type': 'text/plain' });
            res.end();
        });
    } else {
        res.writeHead(200);
        res.write(html);
        res.end();
    }
});

var request = require('request');
cheerio = require('cheerio');


//Scraping..
function loadURL(bodyURL) {
    request(bodyURL, function(error, response, html) {
        // First we'll check to make sure no errors occurred when making the request
        if (!error) {
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            var $ = cheerio.load(html);
            // Finally, we'll define the variables we're going to capture
            log('HTML URL Loaded By Cheerio: ' + body);
            var title, release, rating;
            var json = { title: "", release: "", rating: "" };
            $('.js-postMetaLockup').filter(function() {
                // Let's store the data we filter into a variable so we can easily see what's going on.
                var data = $(this);
                // In examining the DOM we notice that the title rests within the first child element of the header tag. 
                // Utilizing jQuery we can easily navigate and get the text by writing the following code:
                title = data.text();
                // Once we have our title, we'll store it to the our json object.
                json.title = title;
                log('Medium Writer Info: ' + JSON.stringify(json));
            })
        }
    })
}




// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port + '/');