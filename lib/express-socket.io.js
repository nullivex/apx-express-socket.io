'use strict';
var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , socket = require('socket.io')
exports.name = 'express-socket.io'
exports.description = 'express HTTP Server with Socket.IO support'
exports.server = server
exports.start = function(apx,fn){
  //conditionally setup socket.io
  if(!apx.config.exists('socket-io.enabled') || true === apx.config.get('socket-io.enabled')){
    var io = socket.listen(server)
      , logLevel = apx.config.exists('socket-io.logLevel') ? apx.config.get('socket-io.logLevel') : null
    //set default log level for socket.io
    io.set('log level',(null !== logLevel ? logLevel : 3))
    //setup redis store for socket.io for multiple processes
    if('production' === process.env.NODE_ENV){
      apx.sysLog.info('using redis for socket.io store in production')
      var redis = require('redis')
        , RedisStore = require('socket.io/lib/stores/redis')
      io.set('store',new RedisStore({
        redisPub: redis.createClient(),
        redisSub: redis.createClient(),
        redisClient: redis.createClient()
      }))
      io.set('log level',(null !== logLevel ? logLevel : 0))
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
                function(err,response){
                  if(err){
                    response.error(err)
                  }
                  if(response.body){
                    fn(response.body)
                  } else {
                    fn(JSON.stringify(response.get()))
                  }
                }
              )
            })
          })
        })
      })
    }
  }
  //setup express
  //express middleware
  if(
    (!apx.config.exists('express.logger') && 'production' !== process.env.NODE_ENV) ||
      apx.config.get('express.logger')
    ){
    app.use(express.logger('dev'))
  }
  app.use(express.json())
  app.use(express.urlencoded())
  //setup http routing
  if(apx.config.exists('express.routes')){
    apx.config.get('express.routes').forEach(function(route){
      var verb = Object.keys(route)[0]
        , methods = route[verb].methods
      if(undefined === route[verb].methods)
        methods = ['']
      else if('string' === typeof route[verb].methods)
        methods = [route.methods]
      methods.forEach(function(method){
        var path = method ? route[verb].path + '/' + method : route[verb].path
        app[verb](path,function(req,res){
          var request = new apx.Request()
          request.load(req.query)
          request.load(req.data)
          apx.runAction(
            route[verb].file,
            request,
            method || 'run',
            function(err,response){
              if(err){
                response.error(err)
              }
              if(response.body){
                res.send(response.body)
              } else {
                res.send(JSON.stringify(response.get()))
              }
            }
          )
        })
      })
    })
  }
  server.listen(apx.config.get('express.port') || 3000,apx.config.get('express.host'),fn)
}
exports.stop = function(apx,fn){
  server.close(fn)
}