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
        }
    }
  },
})
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
### 0.2.6

 * Fix issue with binary encoded files
 
### 0.2.5

 * Added digest authentication.
 * Added support for windows paths.
 * Fixed a bug with deleting non-existing folders
