exports.name = 'express-socket.io'
exports.description = 'express HTTP Server with Socket.IO support'
exports.translator = function(apx,fn){
  var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
  //setup redis store for socket.io for multiple processes
  if('production' === process.env.NODE_ENV){
    apx.log.info('using redis for socket.io store in production')
    var redis = require('redis')
      , RedisStore = require('socket.io/lib/stores/redis')
    io.set('store',new RedisStore({
      redisPub: redis.createClient(),
      redisSub: redis.createClient(),
      redisClient: redis.createClient()
    }))
  }
  //middleware
  if('production' !== process.env.NODE_ENV){
    app.use(express.logger('dev'))
    io.set('log level',3)
  } else {
    io.set('log level',0)
  }
  app.use(express.json())
  app.use(express.urlencoded())
  //setup http routing
  if(apx.config.exists('express.routes')){
    apx.config.get('express.routes').forEach(function(route){
      var methods = route.methods
      if(undefined === route.methods)
        methods = ['']
      else if('string' === typeof route.methods)
        methods = [route.methods]
      methods.forEach(function(method){
        var verb = Object.keys(route)[0]
          , path = method ? route[verb].path + '/' + method : route[verb].path
        app[verb](path,function(req,res){
          apx.runAction(
            route[verb].file,
            req.data,
            method || 'run',
            function(response){
              res.send(response.rendered)
            }
          )
        })
      })
    })
  }
  //setup socket routing
  if(apx.config.exists('socket-io.routes')){
    io.sockets.on('connection',function(socket){
      apx.config.get('socket-io.routes').forEach(function(route){
        var methods = route.methods
        if(undefined === route.methods)
          methods = ['']
        else if('string' === typeof route.methods)
          methods = [route.methods]
        methods.forEach(function(method){
          var verb = Object.keys(route)[0]
            , path = method ? verb + ':' + method : verb
          socket.on(path,function(data,fn){
            apx.runAction(
              route[verb],
              data,
              method || 'run',
              function(response){
                fn(response.json || {data: response.rendered})
              }
            )
          })
        })
      })
    })
  }
  server.listen(apx.config.get('express.port'),fn)
}