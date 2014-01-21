apx-express-socket.io [![Build Status](https://travis-ci.org/snailjs/apx-express-socket.io.png?branch=master)](https://travis-ci.org/snailjs/apx-express-socket.io)
============

Express HTTP Server, and Socket.IO translator for APX API server

## Usage

Simply add the initializer to the Apx config.

```
$ npm install apx apx-express-socket.io
```

```js
var apx = require('apx')
apx.start({
  translators: ['apx-express-socket.io']
})
```

## Configuration

### Express

### Host
* Variable `express.host`
* Require **no**
* Default `null`

Host for express to listen on will default to the express default otherwise

#### Port
* Variable `express.port`
* Required **no**
* Default `3000`

Port to listen on otherwise will default to 3000

### Logger
* Variable `express.logger`
* Require **no**
* Default `null`

Enable or disable the express connection logger explicitly. By default it will
be used during development and disabled when `NODE_ENV` is set to `production`

#### Routes
* Variable `express.routes`
* Required **no**

Array of routes that should be accepted.

```js
{
  express: {
    routes: [
      {get: {path: '/status', file: 'actions/status.js'}}
      {post: {path: '/page', file: 'actions/page.js', methods: ['list','find','findOne','save','remove']}}
    ]
  }
}
```

#### Busboy

Busboy is the HTTP multipart parser for the express translator. In order to configure busboy
use any of the prescribed configuration options in the docs [see here](https://github.com/mscdex/busboy#busboy-methods)

Example
```js
{
  express: {
    busboy: {
      limits: {
        fileSize: 33554432 //32MB
      }
    }
  }
}
```

### Socket.IO

#### Enabled
* Variable `socket-io.enabled`
* Required **no**
* Default `true`

Enable or disable Socket.IO also listening on the express port.

#### Log Level
* Variable `socket-io.logLevel`
* Require **no**
* Default `3`

The log level passed to socket.io defaults to 3 in development 0 in production.

#### Routes
* Variable `socket-io.routes`
* Required **no**

Array of routes that should be accepted. These would be considered event listeners, eg `page:list`

```js
{
  'socket-io': {
    routes: [
      {status: 'actions/status.js'},
      {page: {file: 'actions/page.js', methods: ['list','find','findOne','save','remove']}}
    ]
  }
}
```

## Changelog

### 0.3.0
* Upgraded to work with apx 0.6.0
* Response handling now does the rendering in the translator
* Added `busboy` to handle incoming file uploads
* Works with latest apx file object format
* Supports sending json, xml, raw, and files
* Added extensive testing against input and output formats
* In order to support busboy and mime type detection node support for node ~0.8 has been dropped

### 0.2.0
* Upgraded to work with apx 0.4.0
* Added additional configuration parameters for express
* Socket.io can now be disabled through the config
* Added additional configuration parameters for socket.io

### 0.1.0
* Initial release
