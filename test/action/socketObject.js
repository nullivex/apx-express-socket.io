'use strict';
var expect = require('chai').expect
exports.name = 'socketObject'
exports.description = 'Test Socket.IO Responses using Objects'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('object')
  res.set('foo','object')
  next()
}