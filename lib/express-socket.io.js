'use strict';
var express = require('express')
  , xml = require('jsontoxml')
  , app = express()
  , server = require('http').createServer(app)
  , socket = require('socket.io')
  , Busboy = require('busboy')
  , fs = require('fs')
  , temp = require('temp')

var startSocketIO = function(apx){
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
var startExpress = function(apx,fn){
  //express middleware
  if(
    (!apx.config.exists('express.logger') && 'production' !== process.env.NODE_ENV) ||
      apx.config.get('express.logger')
    ){
    app.use(express.logger('dev'))
  }
  app.use(function(req,res,next){
    res.header('Access-Control-Allow-Origin','*')
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers','Content-Type, Authorization, Content-Length, X-Requested-With')
    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
      res.send(200)
    } else {
      next()
    }
  })
  app.use(function(req,res,next){
    var contentType = req.get('content-type')
    if('post' === req.method.toLowerCase() && contentType && 0 === contentType.indexOf('multipart/form-data')){
      req.files = req.files || []
      req.body = req.body || {}
      var busboy = new Busboy({ headers: req.headers });
      busboy.on('file',function(fieldname,file,filename){
        var tmpFile = temp.openSync()
        file.on('data',function(data){
          fs.writeSync(tmpFile.fd,data)
        })
        file.on('end', function() {
          req.files.push(new apx.File(tmpFile.path,filename,fieldname,{tmpFile: true}))
        })
      })
      busboy.on('field',function(fieldname,val){
        req.body[fieldname] = val
      })
      busboy.on('error',next)
      busboy.on('end',function(){
        next()
      })
      req.pipe(busboy)
    } else {
      app.use(express.json())
      app.use(express.urlencoded())
      next()
    }
  })
  //setup http routing
  if(apx.config.exists('express.routes')){
    apx.config.get('express.routes').forEach(function(route){
      var verb = Object.keys(route)[0]
        , methods = route[verb].methods
      if(undefined === route[verb].methods)
        methods = ['']
      else if('string' === typeof route[verb].methods)
        methods = [route[verb].methods]
      methods.forEach(function(method){
        var path = method ? route[verb].path + '/' + method : route[verb].path
        app[verb](path,function(req,res){
          var request = new apx.Request()
          request.load(req.query)
          request.load(req.body)
          request.files = req.files
          apx.runAction(
            route[verb].file,
            request,
            method || 'run',
            function(err,response){
              if(err){
                response.error(err)
              }
              response.render(function(err,result){
                if(err) throw err
                if('file' === result.format){
                  //deal with sending a file
                  result.file.populate(function(){
                    res.type(result.file.mimeType)
                    res.header('Content-Disposition','attachment; filename="' + result.file.name + '"')
                    res.sendfile(result.file.path,function(err){
                      if(err) throw err
                      if(true === result.file.options.get('tmpFile')){
                        fs.unlink(result.file.path)
                      }
                    })
                  })
                } else if ('raw' === result.format){
                  //deal with sending a raw response
                  res.type(result.mimeType)
                  res.send(result.body)
                } else if ('object' === result.format){
                  //deal with sending an object
                  if('application/json' === result.mimeType){
                    res.type(result.mimeType + '; charset=' + result.charset)
                    res.send(JSON.stringify(result.data))
                  } else if ('application/xml' === result.mimeType){
                    res.type('application/xml')
                    var parsedXml = xml({response: result.data})
                    res.send(parsedXml)
                  } else {
                    throw new Error('Unsupported response format for object: ' + result.mimeType)
                  }
                }
              })
            }
          )
        })
      })
    })
  }
  server.listen(apx.config.get('express.port') || 3000,apx.config.get('express.host'),fn)
}

exports.name = 'express-socket.io'
exports.description = 'express HTTP Server with Socket.IO support'
exports.server = server
exports.start = function(apx,fn){
  //conditionally setup socket.io
  if(!apx.config.exists('socket-io.enabled') || true === apx.config.get('socket-io.enabled')){
    startSocketIO(apx)
  }
  //conditionally setup express
  if(!apx.config.exists('express.enabled') || true === apx.config.get('express.enabled')){
    startExpress(apx,fn)
  } else {
    fn()
  }
}
exports.stop = function(apx,fn){
  server.close(fn)
}