var static = require('node-static'),
        url = require('url'),
        path = require('path'),
        request = require('request'),
        fs = require('fs'),
        gm = require('gm'),
        startTime = 0,
        endTime = 0,
        diif = 0;

var apiKey = "dhYUzjyQMX"; //Before we will get db running
var fileServer = new static.Server('./output', {cache: 3600});

require('http').createServer(function(request, response) {
    
    
    startTime = new Date().getTime();
    
    
    var parsedUrl = url.parse(request.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;
    console.log(queryAsObject.k);
    if(queryAsObject.k){
        if(queryAsObject.k !== apiKey){
            response.writeHead(401, {'Content-Type': 'text/html'});
            response.end("incorrenct  API KEY");
            return;
        }
        
    }else{
         response.writeHead(401, {'Content-Type': 'text/html'});
         response.end("missing API KEY");
         return;
       
    }

    startTime = new Date().getTime();
    var startT = process.hrtime();
    var parsedUrl = url.parse(request.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;

    var image_url = queryAsObject.url;

    if (!image_url) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end("missing image url parameter... try http://kvazar.rtvslo.si/gmagick?url=http://www.wired.com/wiredenterprise/wp-content/uploads//2012/10/ff_googleinfrastructure_large.jpg");
        return;
    }
    ;


    var filename = image_url.substring(image_url.lastIndexOf("/"), image_url.length);

    console.log(image_url.lastIndexOf("/"));

    if (filename === "/" || image_url.lastIndexOf("/") === -1) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end("Malformed url2");
        return;
    }
    ;

    var width = typeof queryAsObject.w !== 'undefined' ? queryAsObject.w : 720;
    var height = typeof queryAsObject.h !== 'undefined' ? queryAsObject.w : 720;

    if (height > 1920)
        height = 1920;
    if (width > 1920)
        width = 1920;

    //Now use node-static to serve file if exists


    var ending = filename.substring(filename.lastIndexOf("."), filename.length);

    var newfilename = filename.replace(ending, "_" + width + "_" + height + ending);

    request.url = newfilename;

    request.addListener('end', function() {

        fileServer.serve(request, response, function(err, result) {
            if (err) { // There was an error serving the file

                if (err.status === 404) {
                    //DOWNLOAD 

                    download(image_url, __dirname + '/orig' + filename, response, function() {

                        console.log('done download');

                        fs.exists(__dirname + '/orig' + filename, function(exists) {
                            if (exists) {
                                endTime = new Date().getTime();
                                diff = endTime - startTime;
                                console.log("Time to download: " + diff + "ms");

                                //filename = filename.replace("/", "\\");
                                //newfilename = newfilename.replace("/", "\\");
                                console.log(__dirname + '/orig' + filename);
                                gm(__dirname + '/orig' + filename)
                                        .resize(width, height, "")
                                        .subCommand('composite')
                                        .in('-compose', 'Over', __dirname + '/watermark/rtvslo_mmc_logo.png')
                                        .in('-gravity', 'southeast')

                                        //.stroke("#ffffff")

                                        //  .drawCircle(10, 10, 20, 10)
                                        //.font("font/RobotoCondensed-Regular.ttf", 15)
                                        //.drawText(30, 20, "MMC RTVSLO")
                                        .write(__dirname + '/output' + newfilename, function(err) {
                                            if (!err) {
                                                console.log('done resize');
                                                endTime = new Date().getTime();
                                                diff = endTime - startTime;
                                                console.log("Time to resize: " + diff + "ms");

                                                fs.readFile(__dirname + '/output' + newfilename, function(err, data) {
                                                    if (err)
                                                        throw err; // Fail if the file can't be read.

                                                    response.writeHead(200, {'Content-Type': 'image/jpeg'});
                                                    response.end(data);
                                                    startT = process.hrtime(startT);

                                                    console.log('operation took %d seconds and %d microseconds', startT[0], Math.floor(startT[1] / 1000));

                                                    fs.unlink(__dirname + '/orig/' + filename, function(err) {
                                                        if (err)
                                                            throw err;

                                                        console.log('successfully deleted ' + __dirname + '/orig/' + filename);
                                                    });

                                                });


                                            } else {
                                                console.log(err);
                                                response.writeHead(200, {'Content-Type': 'text/html'});
                                                response.end("ERROR: " + err);
                                                return;
                                            }
                                            ;


                                        });

                            }


                        });


                    }
                    );



                } else {
                    console.log("Error serving " + request.url + " - " + err.message);
                    console.log(JSON.stringify(err));
                    // Respond to the client
                    response.writeHead(err.status, err.headers);
                    response.end();
                }
            } else {
                startT = process.hrtime(startT);

                console.log('operation took %d seconds and %d microseconds', startT[0], Math.floor(startT[1] / 1000));
                console.log(JSON.stringify(result));
            }
        });
    }).resume();
}).listen(9616);

var transform = function() {

}


var download = function(uri, filename, error_resp, callback) {

    console.log("Download:  " + uri);
    request.head(uri, function(err, res, body) {

        if (!err) {

            var type = res.headers['content-type'];
            var size = res.headers['content-length'];

            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);



            if (type === "image/jpeg" || type === "image/png" || type === "image/gif") {

                if (size !== "0") {
                    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback).on('error', function(e) {
                        console.log(e);
                        error_resp.writeHead(200, {'Content-Type': 'text/html'});
                        error_resp.end("ERROR: " + e);
                        return;
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
        } else {
            error_resp.writeHead(200, {'Content-Type': 'text/html'});
            error_resp.end("ERROR: " + err);
            return;
        }


    });

};