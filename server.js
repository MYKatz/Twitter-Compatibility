const express = require('express');
const app = express();
const Twitter = require('twitter');

// allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var personalityInsights = new PersonalityInsightsV3({
    version: '2017-10-13',
    username: 'USERNAME',
    password: 'PASSWORD',
    url: 'https://gateway.watsonplatform.net/personality-insights/api'
  });
  
// twitter config

var client = new Twitter({
  consumer_key: "",
  consumer_secret: "",
  access_token_key: "",
  access_token_secret: ""
});

// functions

function processDiff(arr1, arr2){
    if(arr1.length != arr2.length){
        return false;
    }
    else{
        var total = 0;
        for(var i=0;i<arr1.length;i++){
            total = total + Math.abs(arr1[i].percentile - arr2[i].percentile);
        }
        //return average
        return {result: "" + (1 - (total / 3))};
    }
}

app.get('/api/:first/:second', function(req, res){
    var cItems1 = [];
    var cItems2 = [];
    var profile1 = [];
    var profile2 = [];
   client.get('statuses/user_timeline', {screen_name: req.params.first.replace("@","")}, function(error, tweets, response) {
      if (error){res.send('error!');}
      if (!error) {
        for(var i=0;i<tweets.length;i++){
            cItems1.push({"content": tweets[i].text, "contenttype": "text/plain"});
        }
        client.get('statuses/user_timeline', {screen_name: req.params.second.replace("@","")}, function(error, tweets, response) {
          if (error){res.send('error!');}
          if (!error) {
            for(var i=0;i<tweets.length;i++){
                cItems2.push({"content": tweets[i].text, "contenttype": "text/plain"});
            }
          }
          //res.send([cItems1, cItems2]);
          personalityInsights.profile({content: {"contentItems":cItems1}, 'content_type': 'application/json'}, function(error, profile) {
              if (error) {
                if(error.code == 400){
                  res.send('insufficient amount of tweets.. choose someone who tweets more!')  
                }
                else{
                  console.log('err');
                }
              } else {
                for(var i=0;i<profile.personality.length;i++){
                    profile1.push({'name': profile.personality[i].name, 'percentile': profile.personality[i].percentile});
                }
                //console.log(JSON.stringify(profile, null, 2));
                personalityInsights.profile({content: {"contentItems":cItems2}, 'content_type': 'application/json'}, function(error, profile) {
                      if (error) {
                        if(error.code == 400){
                          res.send('insufficient amount of tweets.. choose someone who tweets more!')  
                        }
                        else{
                          console.log('err');
                        }
                      } else {
                        for(var i=0;i<profile.personality.length;i++){
                            profile2.push({'name': profile.personality[i].name, 'percentile': profile.personality[i].percentile});
                        }
                        //console.log(JSON.stringify(profile, null, 2));
                        var result = processDiff(profile1, profile2).result;
                        res.send({
                            name1: req.params.first,
                            name2: req.params.second,
                            result: result
                        });
                      }
                  });
              }
          });
        });
      }
    });
});

app.listen(process.env.PORT || 8080, () => console.log('App listening on port 8080!'));