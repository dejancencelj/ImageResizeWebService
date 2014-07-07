var fs = require('fs')
        , gm = require('gm')
        , request = require('request')
        , http = require('http')
        , url = require("url");

var index = fs.readFileSync('index.html');
var startTime = 0;
var endTime = 0;
var diif = 0;
http.createServer(function(req, res) {
    startTime = new Date().getTime();
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;

    console.log(JSON.stringify(queryAsObject));

    var image_url = queryAsObject.url;

    if (typeof image_url === "undefined") {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end("missing url parameter... try http://kvazar.rtvslo.si/?url=http://www.wired.com/wiredenterprise/wp-content/uploads//2012/10/ff_googleinfrastructure_large.jpg");
        return;
    }
    ;

    var filename = image_url.substring(image_url.lastIndexOf("/"), image_url.length);

    console.log(filename);

    fs.exists('./output' + filename, function(exists) {
        if (exists) {
            fs.readFile('./output' + filename, function(err, data) {
                if (err)
                    throw err; // Fail if the file can't be read.
                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                res.end(data);
                endTime = new Date().getTime();
                diff = endTime - startTime;
                console.log("File exist... time to serve: " + diff + "ms");

            });
        } else {
            download(image_url, './orig' + filename, function() {
                console.log('done download');
                endTime = new Date().getTime();
                diff = endTime - startTime;
                console.log("Time to download: " + diff + "ms");
                gm('./orig/' + filename)
                        .resize(720, 720)

                        //.stroke("#ffffff")

                        //  .drawCircle(10, 10, 20, 10)
                        .font("./font/RobotoCondensed-Regular.ttf", 15)
                        .drawText(30, 20, "MMC RTVSLO")
                        .write('./output' + filename, function(err) {
                            if (!err)
                                console.log('done resize');
                            console.log(JSON.stringify(err));
                            endTime = new Date().getTime();
                            diff = endTime - startTime;
                            console.log("Time to resize: " + diff + "ms");

                            fs.readFile('./output' + filename, function(err, data) {
                                if (err)
                                    throw err; // Fail if the file can't be read.

                                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                                res.end(data);
                                endTime = new Date().getTime();
                                diff = endTime - startTime;
                                console.log("Time to serve: " + diff + "ms");

                                fs.unlink('./orig/' + filename, function(err) {
                                    if (err)
                                        throw err;
                                    console.log('successfully deleted /tmp/hello');
                                });

                            });


                        });
            });
        }
    });



}).listen(9615);


var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {

        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback).on('error', function(e) {
            console.log(e);
        });
    });

};