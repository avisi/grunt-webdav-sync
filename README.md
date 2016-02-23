# grunt-webdav-sync

> Synchronizes a local folder to a remote webdav folder

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-webdav-sync --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-webdav-sync');
```

## The "webdav_sync" task

### Overview
In your project's Gruntfile, add a section named `webdav_sync` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  webdav_sync: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.local_path
Type: `String`
Default value: `none`

A local path pattern to load files from. the `local_path` is relative from the Gruntfile.js root. The files from `local_path` will be copied from the ** directory so if upload contains for example `test.json` and the `remote_path` is `http://user:password@localhost:9001/path/to` it will upload to `http://user:password@localhost:9001/path/to/test.json`.

#### options.remote_path
Type: `String`
Default value: `none`

The server to upload the file to. This accepts all default URL's so you can add username, password or a port.

#### options.sendImmediately
Type: `Boolean`
Default value: `false`

sendImmediately defaults to false, which means request will retry with a proper authentication header after receiving a 401 response from the server (which must contain a WWW-Authenticate header indicating the required authentication method). When setting it to true a basic authentication header is sent.

#### options.strictSSL
Type: `Boolean`
Default value: `false`

If true, requires SSL certificates be valid. Note: to use your own certificate authority, you need to specify an agent that was created with that CA as an option.

### Usage Examples

#### Default Options
In this example, the default options are used to copy files from a directory to a remote webdav server.

```js
grunt.initConfig({
  webdav_sync: {
    default: {
        options: {
           local_path: 'test/assets/upload/**',
           remote_path: 'http://user:password@localhost:9001/path/to'
           sendImmediately: true,
           strictSSL: false
        }
    }
  },
})
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 0.2.9
 * Add support for grunt 1.0

### 0.2.9
 * Bugfix: fixes #18
 
### 0.2.8
 * Added configuration options to enforce digest authentication, and skip the validity check for SSL certificates

### 0.2.7

 * Removed the hardcoded extensions to detect binary files and added isbinaryfile lib to detect this.

### 0.2.6

 * Fix issue with binary encoded files.

### 0.2.5

 * Added digest authentication.
 * Added support for windows paths.
 * Fixed a bug with deleting non-existing folders.
