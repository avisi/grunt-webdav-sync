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

var createFolderOnRemote = function(grunt, remoteURL, callback) {
    grunt.verbose.writeln("Creating folder: " + remoteURL);
    var parsedUrl = url.parse(remoteURL);

    var options = {
        hostname: parsedUrl.hostname,
        method: 'MKCOL',
        port: parsedUrl.port,
        path: parsedUrl.path,
        auth: parsedUrl.auth
    };

    var request = http.request(options, function(res) {
        if(res.statusCode === 201) { //created
            grunt.verbose.writeln("Folder: " + remoteURL + " created");
            callback(null, remoteURL);
        } else if (res.statusCode === 401) {
            callback({status: res.statusCode, message: "Resource requires authorization or authorization was denied. For url: " + remoteURL}, null);
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

    request.on('error', function(e) {
        callback(e, null);
    });
    request.end();
};

var createFileOnRemote = function(grunt, remoteURL, data, callback) {
    grunt.verbose.writeln("Creating file: " + remoteURL);
    var parsedUrl = url.parse(remoteURL);

    var options = {
        hostname: parsedUrl.hostname,
        method: 'PUT',
        port: parsedUrl.port,
        path: parsedUrl.path,
        auth: parsedUrl.auth
    };

    var request = http.request(options, function(res) {
        if(res.statusCode === 500) {
            grunt.log.error("Got a unkown error trying to upload a file to: " + remoteURL);
            callback({message: "Error got a " + res.statusCode + " Trying to upload a file to: " + remoteURL}, null);
        } else {
            grunt.verbose.writeln("File: " + remoteURL + " created");
            callback(null, remoteURL);
        }
    });

    request.on('error', function(e) {
        grunt.log.error("Got a unkown error trying to upload a file to: " + remoteURL);
        callback(e, null);
    });

    request.end(data);
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

        grunt.log.writeln('Searching for files in: ' + options.local_path);
        var files = grunt.file.expand(options.local_path);

        var localPath = files[0];
        files.splice(0, 1); // the first file is always the specified dir we remove it.

        grunt.log.ok('Found ' + files.length + ' files, Start uploading files to ' + options.remote_path);
        grunt.verbose.writeln(grunt.log.wordlist(files));

        var uploadTasks = {};

        files.forEach(function(file) {
            var key = getUploadKey(file, localPath);
            var parent = getParentUploadKey(key);
            var remoteURL = url.resolve(remote_path, path.relative(localPath, file));
            var isDir = grunt.file.isDir(file);

            if(isDir) {
                uploadTasks[key] = createTask(parent, function(callback) {
                    createFolderOnRemote(grunt, remoteURL, callback);
                });
            } else {
                var buffer = grunt.file.read(file, {encoding: null});
                uploadTasks[key] = createTask(parent, function(callback) {
                    createFileOnRemote(grunt, remoteURL, buffer, callback);
                });

            }
        });

        async.auto(uploadTasks, function(err, results) {
            if(err !== null) {
                grunt.log.error(err.message);
                done(false);
            } else {
                done();
            }
        });

    });

};
