'use strict';
var express = require('express')
  , xml = require('jsontoxml')
  , app = express()
  , server = require('http').createServer(app)
  , socket = require('socket.io')
  , Busboy = require('busboy')
  , fs = require('fs')
  , temp = require('temp')
  , io

var startSocketIO = function(apx){
  io = socket.listen(server,apx.config.get('socket-io.config') || {})
  //setup socket routing
  if(apx.config.exists('socket-io.routes')){
    io.sockets.on('connection',function(socket){
      apx.config.get('socket-io.routes').forEach(function(route){
        var verb = Object.keys(route)[0]
          , methods = route[verb].methods
        if(undefined === methods)
          methods = ['']
        else if('string' === typeof methods)
          methods = [methods]
        methods.forEach(function(method){
          var verb = Object.keys(route)[0]
            , path = method ? verb + ':' + method : verb
          socket.on(path,function(data,fn){
            var action = route[verb]
            if('string' !== typeof action && 'object' === typeof action){
              action = action.file
            }
            apx.runAction(
              action,
              data,
              method || 'run',
              function(err,response){
                if(err) response.error(err)
                response.render(function(err,result){
                  if(err) throw err
                  if('file' === result.format){
                    //even if we cant send the file if it is marked temporary remove it
                    if(true === result.file.options.get('tmpFile')){
                      fs.unlinkSync(result.file.path)
                    }
                    //notify the user that we couldnt send the file
                    fn({status: 'error', code: 1, message: 'Cannot send files over Socket.IO'})
                  } else if('raw' === result.format){
                    fn(result.body)
                  } else if('object' === result.format){
                    fn(result.data)
                  } else {
                    throw new Error('Unsupported result format for Socket.IO: ' + result.format)
                  }
                })
              }
            )
          })
        })
      })
    })
  }
}

//setup express
var startExpress = function(apx){
  //express middleware
  if(
    (!apx.config.exists('express.logger') && 'production' !== process.env.NODE_ENV) ||
      apx.config.get('express.logger')
    ){
    app.use(express.logger('dev'))
  }
  //setup options requests
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
  //parse incoming file uploads and save them to a temporary path
  app.use(function(req,res,next){
    var contentType = req.get('content-type')
    if('post' === req.method.toLowerCase() && contentType && 0 === contentType.indexOf('multipart/form-data')){
      req.files = req.files || []
      req.body = req.body || {}
      //setup busboy options
      var busboyOptions = apx.config.get('express.busboy') || {}
      busboyOptions.headers = req.headers
      var busboy = new Busboy(busboyOptions)
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
    } else if('post' === req.method.toLowerCase() && contentType && 0 === contentType.indexOf('application/x-www-form-urlencoded')){
      express.urlencoded()(req,res,next)
    } else if('post' === req.method.toLowerCase() && contentType && contentType.indexOf('json') > -1){
      express.json()(req,res,next)
    } else {
      next()
    }
  })
  //setup static webserver
  if(apx.config.get('express.static')){
    app.use(express.static(apx.config.get('express.static')))
  }
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
          request.raw = {req: req, res: res}
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
    startExpress(apx)
  }
  //start the server regardless of which translator was started
  server.listen(apx.config.get('express.port') || 3000,apx.config.get('express.host'),fn)
}
exports.stop = function(apx,fn){
  server.close(fn)
}