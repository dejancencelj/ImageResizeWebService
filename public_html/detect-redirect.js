// Load the http module to create an http server.
var http = require('http'),
    MobileDetect = require('mobile-detect');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  var md = new MobileDetect(request.headers['user-agent']);  
  var location = 'http://facebook.com';
  if(md.os() === 'iOS'){
      location = 'https://itunes.apple.com/us/app/facebook/id284882215?mt=8';
  }else if(md.os() === "AndroidOS"){
     location = 'https://play.google.com/store/apps/details?id=com.facebook.katana&referrer=utm_source%3Dgoogle%26utm_medium%3Dorganic%26utm_term%3Dmarket://details?id%3Dcom.facebook.katana&pcampaignid=APPU_QyoEVI8Chcc5mKqAiAY8';
  }
  
    response.writeHead(302, {
        'Location': location            
    });
    response.end();
  
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(9618);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");