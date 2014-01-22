'use strict';
var expect = require('chai').expect
exports.name = 'socketRouteMethods'
exports.description = 'Test Socket.IO Route with Methods'
exports.run = function(apx,req,res,next){
  res.error('no default method')
  next()
}
exports.test1 = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('test1')
  res.success()
  next()
}
exports.test2 = function(apx,req,res,next){
  res.success()
  next()
}