/*
 * grunt-webdav-sync
 * https://github.com/avisi/grunt-webdav-sync
 *
 * Copyright (c) 2013 Avisi B.V.
 * Licensed under the MIT license.
 */

'use strict';

var http = require("http");
var path = require("path");
var url = require('url');
var async = require('async');
var request = require('request');
var isBinaryFileSync = require("isbinaryfile");

var createRequestOptions = function(remoteURL, method, configurationOptions) {
    var parsedUrl = url.parse(remoteURL);
    var auth = parsedUrl.auth;

    if(auth !== null) {
        var splittedString = auth.split(":");
        auth = {
            user: splittedString[0],
            pass: splittedString[1],
            sendImmediately: configurationOptions.sendImmediately
        };
    }

    var options = {
        uri: parsedUrl,
        method: method,
        auth: auth,
        strictSSL: configurationOptions.strictSSL
    };

    options.uri.auth = "";

    return options;
};

var deleteFolderOnRemote = function(grunt, remoteURL, callback, configurationOptions) {
    grunt.verbose.writeln("Deleting folder: " + remoteURL);
    var options = createRequestOptions(remoteURL, 'DELETE', configurationOptions);

    request(options, function(error, res, body) {
        if(res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 404) {
            //OK, No Content, or Not Found; all good
            grunt.verbose.writeln("Folder: " + remoteURL + " deleted");
            callback(null, remoteURL);
        } else if (res.statusCode === 207) { // res.body contains an XML WebDAV multistatus message; see http://tools.ietf.org/search/rfc2518#section-11
            var matches = res.body.match("status>([^<]+)</"); // cheaper than parsing string using xml2js or similar
            var status = matches.length > 1 ? matches[1] : "HTTP/1.1 000 No status message returned in " + body;
            // D:status element contains an HTTP response status line (see http://tools.ietf.org/search/rfc2616#section-6.1) like so:
            // HTTP-Version SP Status-Code SP Reason-Phrase CRLF
            matches = status.match("^[^\s]+ ([0-9]{3}) (.+)$");
            var statusCode = parseInt(matches[1]);
            var statusMessage = matches[2];

            if (statusCode === 404) { // we don't actually care if remote directories don't exist (yet)
                callback(null, remoteURL);
            } else {
                callback({status: statusCode, message: statusMessage}, null);
            }
        } else if (res.statusCode === 423) {
            callback({status: res.statusCode, message: "Could not remove the locked folder For url: " + remoteURL}, null);
        } else if (res.statusCode === 401) {
            request(options, function(error,res,body) {
                if(res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 404) {
                    callback(null, remoteURL);
                }
            });
        } else if (res.statusCode === 301) {
            options.uri = res.headers.location;
            request(options, function(error,res,body) {
                if(res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 404) {
                    callback(null, remoteURL);
                } else {
                    callback({status: res.statusCode, message: error}, null);
                }
            });
        } else {
            callback({status: res.statusCode, message: "Unknown error while deleting \'" + remoteURL + "\' gave statuscode: " + res.statusCode}, null);
        }
    }).setMaxListeners(0);
};

var createFolderOnRemote = function(grunt, remoteURL, callback, configurationOptions) {
    grunt.verbose.writeln("Creating folder: " + remoteURL);

    var options = createRequestOptions(remoteURL, 'MKCOL', configurationOptions);

    request(options, function(error, res, body) {
        if(res.statusCode === 201) { //created
            grunt.verbose.writeln("Folder: " + remoteURL + " created");
            callback(null, remoteURL);
        } else if (res.statusCode === 401) {
            request(options, function(error, res,body) {
                if(res.statusCode === 201) {
                    callback(null, remoteURL);
                }
            });
        } else if (res.statusCode === 403) {
            callback({status: res.statusCode, message: "The server does not allow collections to be created at the specified location, or the parent collection of the specified request URI exists but cannot accept members."}, null);
        } else if (res.statusCode === 405) {
            grunt.verbose.writeln("Folder already exists : " + remoteURL);
            callback(null, remoteURL);
        } else if (res.statusCode === 409) {
            callback({status: res.statusCode, message: "A resource cannot be created at the destination URI until one or more intermediate collections are created. For url: " + remoteURL}, null);
        } else if (res.statusCode === 415) {
            callback({status: res.statusCode, message: "The request type of the body is not supported by the server."}, null);
        } else if(res.statusCode === 409) {
            callback({status: res.statusCode, message: "The destination resource does not have sufficient storage space."}, null);
        } else {
            callback({status: res.statusCode, message: "Unknown error while uploading a dir."}, null);
        }
    });
};

var createFileOnRemote = function(grunt, remoteURL, data, callback, configurationOptions) {
    grunt.verbose.writeln("Creating file: " + remoteURL);
    var options = createRequestOptions(remoteURL, 'PUT', configurationOptions);

    options.body = data;

    request(options, function(error, res, body) {
        if(res.statusCode === 500) {
            grunt.log.error("Got a unkown error trying to upload a file to: " + remoteURL);
            callback({message: "Error got a " + res.statusCode + " Trying to upload a file to: " + remoteURL}, null);
        } else if (res.statusCode === 401) {
            request(options, function(error, res,body) {
                if(res.statusCode === 201) {
                    callback(null, remoteURL);
                }
            });
        } else if (Math.floor(res.statusCode / 100) === 2) {
            grunt.verbose.writeln("File: " + remoteURL + " created");
            callback(null, remoteURL);
        } else {
            grunt.log.error("Got a unkown error trying to upload a file to: " + remoteURL);
            callback({message: "Error got a " + res.statusCode + " Trying to upload a file to: " + remoteURL}, null);
        }
    });


};

var getUploadKey = function(filePath, localPath) {
    return path.relative(localPath, filePath);
};

var getParentUploadKey = function(uploadKey) {
    var pathParts = uploadKey.split(path.sep);
    if(pathParts.length > 1) {
        pathParts.splice(pathParts.length - 1, 1);
        return pathParts.join(path.sep);
    }
    return false;
};

var createTask = function(parent, func) {
    if(parent === false) {
        return function(callback) {
            func(callback);
        };
    } else {
        return [parent, function(callback) {
            func(callback);
        }];
    }
};


module.exports = function(grunt) {

    grunt.registerMultiTask('webdav_sync', 'Synchronizes a local folder to a remote webdav folder', function() {

        var done = this.async();
        grunt.log.writeln('starting webdav_sync');
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options();
        var remote_path = options.remote_path;
        var configurationOptions = {};

        configurationOptions.sendImmediately = options.sendImmediately;
        configurationOptions.strictSSL = options.strictSSL;

        grunt.log.writeln('Searching for files in: ' + options.local_path);

        var files = grunt.file.expand(options.local_path);

        var localPath = files[0];
        files.splice(0, 1); // the first file is always the specified dir we remove it.

        grunt.log.ok('Found ' + files.length + ' files, Start uploading files to ' + options.remote_path);
        grunt.verbose.writeln(grunt.log.wordlist(files));

        var dirTasks = [];
        var fileTasks = [];

        files.forEach(function(file) {
            var remoteURL = url.resolve(remote_path, path.relative(localPath, file).replace(/\\/g, '/'));
            var isDir = grunt.file.isDir(file);

            if(isDir) {
                // Remove existing dir and create a new one
                dirTasks = dirTasks.concat([
                    function(taskCallback) {
                        deleteFolderOnRemote(grunt, remoteURL, taskCallback, configurationOptions);
                    },
                    function(taskCallback) {
                        createFolderOnRemote(grunt, remoteURL, taskCallback, configurationOptions);
                    }
                ]);
            } else {
                var options = {};
                //if it is a binary image file, skip encoding
                if(isBinaryFileSync(file)){
                    options.encoding = null;
                }
                fileTasks.push(function(callback) {
                    var buffer = grunt.file.read(file, options);
                    createFileOnRemote(grunt, remoteURL, buffer, callback, configurationOptions);
                });

            }
        });


        async.series(dirTasks.concat(fileTasks), function(err, results) {
            if(err !== null) {
                grunt.log.error(err.message);
                done(false);
            } else {
                done();
            }
        });

    });

};