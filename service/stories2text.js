const aws = require('aws-sdk');
const s3 = new aws.S3();


var S3FS = require('s3fs');
var bucketPath = 'yumod.com.data';
var s3Options = { region: 'us-west-1' };
var s3fsImpl = new S3FS(bucketPath, s3Options);



exports.loadUserStoriesAndProcess = function(sqsModel) {
    loadYumodStoryModel(sqsModel);
};


/*==================================================================
    LOAD YUMOD STORY MODEL AND START FETCH
===================================================================*/

function loadYumodStoryModel(sqsModel) {

    console.log("Loading started")

    //Load From S3
    var objPath = sqsModel.storyModelPath;

    console.log("Load From S3 username:" + objPath);
    var params = { Bucket: bucketPath, Key: objPath };
    s3.getObject(params, function(err, data) {
        // Handle any error and exit
        if (err) {
            console.log(err + " Story Not accessed");
            return err;
        }

        // No error happened
        // Convert Body from a Buffer to a String
        var objectData = data.Body.toString('utf-8'); // Use the encoding necessary
        sqsModel.data = JSON.parse(objectData);

        //Process Types
        //processUserAllStoriesSync(sqsModel);
        //processUserAllStoriesConc(sqsModel);
        processUserAllStoriesAsync(sqsModel);
        //processUserAllStoriesAsync2();
    });

}




var async = require('async');
var request = require('request');
var cheerio = require('cheerio');


//=======  SYNC =========================================================
var syncStoriesMap = {}
var hrstart = null;

function processUserAllStoriesSync(sqsModel) {

    var stories = sqsModel.data.stories;
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        story.sUrl = encodeURI(story.sUrl);
        syncStoriesMap[story.sUrl] = story;
    }

    hrstart = process.hrtime();
    loadURLSync(stories[0].sUrl);
}


function loadURLSync(url) {
    console.log("Started -> " + url);
    request(url, function(error, response, html) {
        console.log("Url Loaded -> " + url);
        var hrend = process.hrtime(hrstart);
        console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);

        syncStoriesMap[url].loaded = true;
        for (key in syncStoriesMap) {
            var story = syncStoriesMap[key];
            if (!story.loaded) {
                loadURLSync(story.sUrl);

                break;
            } //end of if
        }
    });
}



//=======  CONCURRENT =========================================================
var counterConc = 1;
var counterStar = 1;

function processUserAllStoriesConc(sqsModel) {

    hrstart = process.hrtime();
    counterConc = 1;
    var stories = sqsModel.data.stories;
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        story.sUrl = encodeURI(story.sUrl);
        loadURLConc(story.sUrl);
    }
}


function loadURLConc(url) {
    console.log("Started -> " + url + " count:" + counterStar++);
    request(url, function(error, response, html) {
        if (!error) console.log("Url Loaded -> " + url + " count:" + counterConc++);
        else console.log("Url Error -> " + url + " count:" + counterConc++);
        var hrend = process.hrtime(hrstart);
        console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);

        //HTML
        if (html != undefined) console.log("html:" + html.substring(0, 200) + "\n\n");
        else console.log("HTML UNDEFINED");
    });
}



//=======  ASYNC =========================================================

var counterAsync = 0;

function processUserAllStoriesAsync(sqsModel) {

    var writerStoryUrls = []
    var stories = sqsModel.data.stories;
    hrstart = process.hrtime();
    counterAsync = 1;
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        var encodedURL = encodeURI(story.sUrl);
        writerStoryUrls.push(encodedURL);
    }

    console.log("WriterStory Length:" + writerStoryUrls.length);
    async.mapLimit(writerStoryUrls, 20, loadURLAsync, function(err, results) {
        console.log("Loading Ended");
        console.log(err);
        convertHTML2Text(sqsModel, results);
    });

}



function loadURLAsync(url, doneCallback) {

    console.log("Started -> " + url + " count:" + counterStar++);
    request(url, function(error, response, html) {
        if (!error) console.log("Url Loaded -> " + url + " count:" + counterAsync++);
        else console.log("Url Error -> " + url + " count:" + counterConc++);
        var hrend = process.hrtime(hrstart);
        console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);

        //HTML
        if (html != undefined) console.log("html:" + html.substring(0, 200) + "\n\n");
        else console.log("HTML UNDEFINED");

        //return doneCallback(null);
        return doneCallback(null, { url: url, html: html });
    });

}


//=======  CONVERT STORY HTML TO TEXT =========================================================

function convertHTML2Text(sqsModel, results) {

    console.log("Stories Lenght:" + results.length);

    var stories = sqsModel.data.stories;
    var storyMap = {};
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        var encodedURL = encodeURI(story.sUrl);
        storyMap[encodedURL] = story;
    }


    for (var i = 0; i < results.length; i++) {
        var result = results[i];

        var $ = cheerio.load(result.html);
        $('.postArticle-content').filter(function() {
            var data = $(this);
            var text = data.text();
            var wordCount = countWords(text);
            var story = storyMap[result.url];
            story.encodedURL = result.url;
            story.text = text;
            story.wordCount = wordCount;
        })
    }

    sortStoriesAccording2WordCount(sqsModel);
    saveWriterProfile(sqsModel);

}


function countWords(sentence) {
    var index = {},
        words = sentence
        .replace(/[.,?!;()"'-]/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .split(" ");
    return words.length;
}


//============================================================================
var _ = require("underscore");
function sortStoriesAccording2WordCount(sqsModel) {

    var storyArr = _.sortBy(sqsModel.data.stories, function(s) {
        return s.wordCount;
    });

    for (var i = 0; i < storyArr.length; i++) {
        console.log("Loaded ->" + storyArr[i].sUrl + " Word Count:" + storyArr[i].wordCount);
    }
}



function saveWriterProfile(sqsModel) {
    var enrichURL = sqsModel.storyModelPath.replace(".json", "_enrich.json");
    console.log("Text Loaded Finished" + enrichURL);

    var enrichStoryModel = { enrich_stories: sqsModel.data.stories }
    var s3Text = JSON.stringify(enrichStoryModel, null, 4);
    s3fsImpl.writeFile(enrichURL, s3Text).then(function() {
        console.log('It\'s saved!');
    }, function(reason) {
        throw reason;
    });
}




