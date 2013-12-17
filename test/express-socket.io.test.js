describe('InitializerMongoose',function(){
  var Apx = require('apx')
    , apx
    , translator = require('../lib/express-socket.io')
    , request = require('request')
    , io = require('socket.io-client')
  before(function(done){
    apx = new Apx({
      testing: true,
      cwd: __dirname,
      express: {
        port: 3000
      },
      onReady: function(){done()}
    })
  })
  describe('properties',function(){
    it('should have a name',function(){
      expect(translator.name).to.equal('express-socket.io')
    })
    it('should have a description',function(){
      expect(translator.description).to.equal('express HTTP Server with Socket.IO support')
    })
    it('should implement a translator function',function(){
      expect(translator.translator).to.be.a('function')
    })
  })
  describe('start translator',function(){
    var inst
    before(function(done){
      inst = translator.translator(apx,done)
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