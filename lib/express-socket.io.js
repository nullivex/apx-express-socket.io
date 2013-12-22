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
      apx.log.info('using redis for socket.io store in production')
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
                  fn(response.json || {body: response.rendered})
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
            function(err,response){
              if(err){
                response.error(err)
              }
              res.send(response.rendered)
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