console.log(__dirname);
var fs = require('fs')
        , gm = require('gm')
        , request = require('request')
        , http = require('http')
        , url = require('url');

//var index = fs.readFileSync('index.html');
var startTime = 0;
var endTime = 0;
var diif = 0;
var apiKey = "dhYUzjyQMX"; //Before we will get db running

http.createServer(function(req, res) {
    startTime = new Date().getTime();
    
    
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;
    
    if(!queryAsObject.k){
        
    }else{
         res.writeHead(401, {'Content-Type': 'text/html'});
         res.end("missing API KEY");
       
    }
    // console.log(JSON.stringify(req));

    var image_url = queryAsObject.url;
    if (typeof image_url === "undefined") {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end("missing url parameter... try http://kvazar.rtvslo.si/gmagick?url=http://www.wired.com/wiredenterprise/wp-content/uploads//2012/10/ff_googleinfrastructure_large.jpg");
        return;
    }
    ;
    var width = typeof queryAsObject.w !== 'undefined' ? queryAsObject.w : 720;
    var height = typeof queryAsObject.h !== 'undefined' ? queryAsObject.w : 720;

    if (height > 1920)
        height = 1920;
    if (width > 1920)
        width = 1920;

    var date = typeof queryAsObject.d !== 'undefined' ? date : "2000-01-01";

    var filename = image_url.substring(image_url.lastIndexOf("/"), image_url.length);
    console.log(filename);
    if (filename === "/") {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end("Malformed url");
        return;
    }

    var ending = filename.substring(filename.lastIndexOf("."), filename.length);

    console.log(ending);
    if (ending === ".JPG" || ending === ".PNG" || ending === ".GIF" || ending === ".jpg" || ending === ".png" || ending === ".gif") {

    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end("Unsupported image format");
        return;
    }

    var newfilename = filename.replace(ending, "_" + width + "_" + height + ending);
    // console.log(filename);

    fs.exists(__dirname + '/output' + newfilename, function(exists) {
        if (exists) {
            fs.readFile(__dirname + '/output' + newfilename, function(err, data) {
                if (err)
                    throw err; // Fail if the file can't be read.

                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                res.end(data);
                endTime = new Date().getTime();
                diff = endTime - startTime;
                console.log("File exist... time to serve: " + diff + "ms");
            });
        } else {
            download(image_url, __dirname + '/orig' + newfilename, res, function() {
                console.log('done download');
                fs.exists(__dirname + '/orig' + newfilename, function(exists) {
                    if (exists) {

                        endTime = new Date().getTime();
                        diff = endTime - startTime;
                        console.log("Time to download: " + diff + "ms");
                        gm(__dirname + '/orig/' + newfilename)
                                .resize(width, height)

                                //.stroke("#ffffff")

                                //  .drawCircle(10, 10, 20, 10)
                                //.font("font/RobotoCondensed-Regular.ttf", 15)
                                //.drawText(30, 20, "MMC RTVSLO")
                                .write(__dirname + '/output' + newfilename, function(err) {
                                    if (!err) {
                                        endTime = new Date().getTime();
                                        diff = endTime - startTime;
                                        console.log("Time to resize: " + diff + "ms");

                                        fs.readFile(__dirname + '/output' + newfilename, function(err, data) {
                                            if (err)
                                                throw err; // Fail if the file can't be read.

                                            res.writeHead(200, {'Content-Type': 'image/jpeg'});
                                            res.end(data);
                                            endTime = new Date().getTime();
                                            diff = endTime - startTime;
                                            console.log("Time to serve: " + diff + "ms");

                                            fs.unlink(__dirname + '/orig/' + newfilename, function(err) {
                                                if (err)
                                                    throw err;
                                                console.log('successfully deleted ' + newfilename);
                                            });

                                        });
                                    } else {
                                        console.log(JSON.stringify(err));
                                    }







                                });

                    }


                });
            });
        }
    });



}).listen(9615);


var download = function(uri, filename, error_resp, callback) {
    request.head(uri, function(err, res, body) {

        var type = res.headers['content-type'];
        var size = res.headers['content-length'];

        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);



        if (type === "image/jpeg" || type === "image/png" || type === "image/gif") {

            if (size !== "0") {
                request(uri).pipe(fs.createWriteStream(filename)).on('close', callback).on('error', function(e) {
                    console.log(e);
                });
            } else {
                error_resp.writeHead(200, {'Content-Type': 'text/html'});
                error_resp.end("content size === 0 ");
                return;
            }
        } else {

            error_resp.writeHead(200, {'Content-Type': 'text/html'});
            error_resp.end("Unsupported image format " + type);
            return;
        }


    });

};


