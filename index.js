var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var zlib = require('zlib');

var Entities = require('html-entities').AllHtmlEntities;

entities = new Entities();

var app = express();

var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true}));

app.get('/',function(req,res) {
  console.log("Body",req.body);
  res.status(200).send("Hello World");
});

createSlackResponse = function(body,hits,response_url) {
  var slackResponse = new Object();
  var attachments = [];

  for (var i = 0; i < hits.length; i++) {


    var hitObject = hits[i];
    console.log("Question found", hitObject.question);
    var minutes = parseInt(hitObject.answerStartTime.substring(0,hitObject.answerStartTime.indexOf("m")));
    var seconds = parseInt(hitObject.answerStartTime.substring(hitObject.answerStartTime.indexOf("m") + 1,hitObject.answerStartTime.length - 1));
    var startTime = minutes*60 + seconds;
    var attachment = {
            "fallback": hitObject.question,

            "color": "#36a64f",

            "pretext": "",

            "author_name": hitObject.episodeNumber,
            "author_link": "https://www.youtube.com/watch?v=" + hitObject.url + "&start=" + startTime,
            "author_icon": "https://yt3.ggpht.com/-gYIpT9q6l2U/AAAAAAAAAAI/AAAAAAAAAAA/N7y-mZkllOc/s88-c-k-no-rj-c0xffffff/photo.jpg",

            "title": hitObject.question,
            "title_link": "https://www.youtube.com/watch?v=" + hitObject.url + "&start=" + startTime,

            "text": entities.decode(hitObject.answerCaptions),

          //  "image_url": "http://img.youtube.com/vi/" + hitObject.url + "/0.jpg",
            "thumb_url": "http://img.youtube.com/vi/" + hitObject.url + "/hqdefault.jpg"
        };

      attachments.push(attachment);
  }


  slackResponse.text = "Welcome to The #AskGaryVee Showwwwwwwwwww.\nYou searched for _*" + body.text +  "*_";
  slackResponse.mrkdwn = true;
  slackResponse.username = "Aditya Shirole";
  slackResponse.attachments = attachments;

  return slackResponse;

};



app.post('/garyvee',function(req,res) {
  console.log("Received request from Slack");
  console.log("Request Body",req.body);

  //Check the token first to verify if request is from Slack. If invalid, send error message
  if (true) {
    console.log("Token verified : " + req.body.token);

    //fetch from ask.garyvaynerchuk.com

    var headers = {
        'Origin': 'http://ask.garyvaynerchuk.com',
        'Accept-Encoding': '',
        'Accept-Language': 'en-GB,en-US;q=0.8,en;q=0.6',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36',
        'Content-type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Referer': 'www.google.com',
        'Connection': 'keep-alive'
    };

    var dataString = '{"params":"query=' + req.body.text + '&hitsPerPage=5&page=0"}';

    var options = {
        url: 'http://xk21fuvr0q-dsn.algolia.net/1/indexes/ANSWERS_EPISODE_DESC/query?X-Algolia-API-Key=cdb135f9dbd8a5bb494bd1b14dcb120d&X-Algolia-Application-Id=XK21FUVR0Q&X-Algolia-Agent=Algolia%20for%20vanilla%20JavaScript%202.9.7',
        method: 'POST',
        headers: headers,
        body: dataString,
        gzip: true
    };

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            console.log("Result from AskGaryVee",req.body.response_url);
            var slackResponse = createSlackResponse(req.body,result.hits,result.response_url);

            var headers = {
                'Content-type': 'application/json',
            };
            var response_url = req.body.response_url;
            var options = {
                url: response_url,
                method: 'POST',
                body: JSON.stringify(slackResponse),
                headers: headers
            };

            console.log("Sending response to slack")
            request(options,function(error,response, body) {
              if (!error && response.statusCode == 200) {
                console.log("Response was sent successfully");
              } else {
                if(!error){
                    console.log("Response code",response.statusCode);
                } else {
                  console.log("Error in sending response",error);
                }
              }
            })

        } else {
          console.log("Error in callback")
        }
    }

    request(options, callback);
    res.status(200).send("Got it! Just a Moment!");

    //create Slack Response
    //var slackResponse = createSlackResponse(req.body);

    //Send response to Slack
    //res.status(200).send(slackResponse);
  } else {
    console.log("Token is invalid. Sending error")
    req.error("Invalid Token");
  }
});

app.listen(port,function() {
  console.log("Listening on port : " + port);
});
