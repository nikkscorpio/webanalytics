var port = process.env.PORT || 3000
var express = require("express");
var fs = require('fs');
var app = express();
var s3 = require('s3');
var shortid = require('shortid');
var qs = require('querystring');
var busboy = require('connect-busboy');
var csv = require("fast-csv");
//var CallObjBean = require('./CallObjBean.js');
//Move credentials to profile file
require("date.js");
app.use(busboy());
var AWS = require('aws-sdk');
S3S = require('s3-streams');
AWS.config.update({
    accessKeyId: 'AKIAIU5XDJTJL3FLN25Q',
    secretAccessKey: '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'
});
AWS.config.update({
    region: 'us-west-2'
});
s3 = new AWS.S3({
    accessKeyId: 'AKIAIU5XDJTJL3FLN25Q',
    secretAccessKey: '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',
    region: 'us-west-2'
});

function CallObjBean(objectId, streamCreator, createdAt, streamLength, streamCreatorSearch) {
    this.streamCreatorSearch = streamCreatorSearch;
    this.objectId = objectId;
    this.streamCreator = streamCreator;
    this.createdAt = createdAt;
    this.streamLength = streamLength;
}
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});
//app.use(express.static(__dirname + "/public"));
app.post('/api/photo', function(req, res) {
    res.setHeader('Connection', 'Transfer-Encoding');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename) {
        console.log("Uploading: " + fieldname);
        var shortidGenerated = shortid.generate();
        var s3obj = new AWS.S3({
            params: {
                Bucket: 'call-analytics-bucket',
                Key: shortidGenerated
            }
        });
        s3obj.upload({
            Body: file
        }).
        on('httpUploadProgress', function(evt) { /*console.log(evt);*/ }).
        send(function(err, data) {
            var csvFileCreated = shortid.generate();
            createCallBeans(shortidGenerated, csvFileCreated);
            setTimeout(function() {
                //response.write(' world!');
                res.writeHead(301, {
                    Location: "http://call-analytics-viz-bucket.s3-website-us-west-2.amazonaws.com?data=" + csvFileCreated
                });
                res.end();
            }, 1000);
        });
    });
});
var numDaysBetween = function(d1, d2) {
    var diff = Math.abs(d1.getTime() - d2.getTime());
    return diff / (1000 * 60 * 60 * 24);
};

 function getSortedKeys(obj) {
    var keys = []; for(var key in obj) keys.push(key);
    return keys.sort(function(a,b){return obj[b]-obj[a]});
}
/*
Calculates the number of unique calls by users for 4 different time periods:
All time, Last Day, Last Week and Last Month
Stores these values in 4 different maps/JSON objects:
allTimeJSON, lastDayJSON, lastWeekJSON, lastMonthJSON
*/
function createTimeJSON(callObjectMap, csvFileCreated) {
    var allTimeJSON = {};
    var streamCreatorSearchJSON = {};
    var lastDayJSON = {};
    var lastWeekJSON = {};
    var lastMonthJSON = {};
    var streamLengthJSON = {};
    //console.log(callObjectMap);
    var csvStr = "name,alltime,lastday,lastweek,lastmonth,streamlength,streamCreatorSearch" + "\n";
    for (var callObjID in callObjectMap) {
        callBean = callObjectMap[callObjID];
        var streamCreator = callBean.streamCreator;
        var createdAt = callBean.createdAt;
        var streamLength = parseFloat(callBean.streamLength);
        var streamCreatorSearch = callBean.streamCreatorSearch;
        var createdAtDate = new Date(createdAt);
        var todayDate = new Date();
        if (!(streamLength < 1 || streamLength > 1081 || streamLength=="NaN")) {
            allTimeJSON[streamCreator] = (streamCreator in allTimeJSON) ? allTimeJSON[streamCreator] + 1 : 1;
            streamCreatorSearchJSON[streamCreator] = (streamCreator in streamCreatorSearchJSON)? streamCreatorSearchJSON[streamCreator] : streamCreatorSearch;

            if (numDaysBetween(todayDate, createdAtDate) <= 1) {
                lastDayJSON[streamCreator] = (streamCreator in lastDayJSON) ? lastDayJSON[streamCreator] + 1 : 1;
            }
            if (createdAtDate.between(Date.today().last().monday(), Date.today().last().sunday())) {
                lastWeekJSON[streamCreator] = (streamCreator in lastWeekJSON) ? lastWeekJSON[streamCreator] + 1 : 1;
            }
            if ((todayDate.getMonth() - createdAtDate.getMonth) == 1) {
                lastMonthJSON[streamCreator] = (streamCreator in lastMonthJSON) ? lastMonthJSON[streamCreator] + 1 : 1;
            }
            streamLengthJSON[streamCreator] = (streamCreator in streamLengthJSON) ? streamLengthJSON[streamCreator] + streamLength : streamLength;
        }
    }

   var sortedStreams = getSortedKeys(streamLengthJSON);
console.log("SORTED"+sortedStreams);

    for (var obj in sortedStreams) {
        var streamCreator = sortedStreams[obj];
        csvStr += streamCreator + ",";
        csvStr += allTimeJSON[streamCreator] + ",";
        csvStr += (streamCreator in lastDayJSON) ? (lastDayJSON[streamCreator] + ",") : (0 + ",");
        csvStr += (streamCreator in lastWeekJSON) ? lastWeekJSON[streamCreator] + "," : 0 + ",";
        csvStr += (streamCreator in lastMonthJSON) ? lastMonthJSON[streamCreator] + "," : 0 + ",";
        csvStr += (streamCreator in streamLengthJSON) ? streamLengthJSON[streamCreator]+ "," : 0+",";
        csvStr += (streamCreator in streamCreatorSearchJSON)? streamCreatorSearchJSON[streamCreator] : "";
        csvStr += "\n";
    }
     console.log("\n NEW ");
    console.log("\n" + csvStr);
    var urlResponse = "index.html";
    var s3bucket = new AWS.S3({
        params: {
            Bucket: 'call-analytics-viz-bucket'
        }
    });
    s3bucket.createBucket(function() {
        var params = {
            Key: csvFileCreated + ".csv",
            Body: csvStr
        };
        s3bucket.upload(params, function(err, data) {
            if (err) {
                console.log("Error uploading data: ", err);
            } else {
                console.log("Successfully uploaded data to myBucket/myKey");
                urlResponse += "?data=" + csvFileCreated + ".csv";
            }
        });
    });
    return urlResponse;
    //createVisualizationFile();
}

/* Function to create Call Bean objects 
* 
*/
function createCallBeans(data, res) {
    var readStream = s3.getObject({
        Bucket: 'call-analytics-bucket',
        Key: data
    }).createReadStream();
    console.log(readStream);
    var callObjMap = {};
    var stream = readStream;
    csv.fromStream(stream, {
        headers: true
    }).on("data", function(data) {
        var newCallObj = new CallObjBean(data.objectId, data.streamCreator, data.createdAt, data.streamLength, data.streamCreatorSearch);
        callObjMap[data.objectId] = newCallObj;
    }).on("end", function() {
        console.log("done");
        var urlResponse = createTimeJSON(callObjMap, res);
        console.log("createCallBeans" + urlResponse);
        return urlResponse;
    });
}
app.listen(port, function() {
    console.log("Working on port 3000");
});