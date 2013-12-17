apx-express-socket.io
============

Express HTTP Server, and Socket.IO translator for APX API server

## Usage

Simply add the initializer to the Apx config.

```
$ npm install apx apx-express-socket.io
```

```js
var Apx = require('apx')
var inst = new Apx({
  translators: [require('apx-express-socket.io')],
  express: {port: 3000}
})
```

## Configuration

### Express

#### Port
* Variable `express.port`
* Required **yes**
* Default `''`

Port to listen on

#### Routes
* Variable `express.routes`
* Required **no**

Array of routes that should be accepted.

```js
{
  express: {
    port: 3000,
    routes: [
      {get: {path: '/status', file: 'actions/status.js'}}
      {post: {path: '/page', file: 'actions/page.js', methods: ['list','find','findOne','save','remove']}}
    ]
  }
}
```

### Socket.IO

#### Routes
* Variable `socket-io.routes`
* Required **no**

Array of routes that should be accepted. These would be considered event listeners, eg `page:list`

```js
{
  express: {
    port: 3000
  },
  'socket-io': {
    routes: [
      {status: 'actions/status.js'},
      {page: {file: 'actions/page.js', methods: ['list','find','findOne','save','remove']}}
    ]
  }
}
```

## Changelog

### 0.1.0
* Initial release