'use strict';
var expect = require('chai').expect
describe('Initializer Express-Socket.io',function(){
  var apx = require('apx')
    , translator = require('../lib/express-socket.io')
    , request = require('request')
    , io = require('socket.io-client')
  before(function(done){
    apx.once('ready',function(){
      done()
    })
    apx.setup({
      testing: true,
      sysLogLevel: 2,
      cwd: __dirname
    })
    apx.start()
  })
  after(function(done){
    apx.once('dead',function(){
      done()
    })
    apx.stop()
  })
  describe('properties',function(){
    it('should have a name',function(){
      expect(translator.name).to.equal('express-socket.io')
    })
    it('should have a description',function(){
      expect(translator.description).to.equal('express HTTP Server with Socket.IO support')
    })
    it('should implement a translator start function',function(){
      expect(translator.start).to.be.a('function')
    })
    it('should implement a translator stop function',function(){
      expect(translator.stop).to.be.a('function')
    })
  })
  describe('start translator',function(){
    var inst
    before(function(done){
      apx.once('ready',function(apx){
        inst = translator.start(apx,done)
      })
      apx.setup({
        testing: true,
        sysLogLevel: 2,
        cwd: __dirname,
        express: {
          logger: false
        },
        'socket-io': {
          logLevel: 0
        }
      })
      apx.start()
    })
    after(function(done){
      apx.once('dead',function(){
        done()
      })
      apx.stop()
    })
    it('should listen on port 3000',function(done){
      request('http://localhost:3000/',function(err,res,body){
        if(err) throw err
        expect(res.statusCode).to.equal(404)
        expect(body).to.equal('Cannot GET /\n')
        done()
      })
    })
    it('should accept socket.io connections',function(done){
      var socket = io.connect('http://localhost:3000')
      socket.on('connect',function(){
        done()
      })
    })
  })
})