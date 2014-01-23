'use strict';
var expect = require('chai').expect
exports.name = 'socketRoute'
exports.description = 'Test Socket.IO Route'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('bar')
  res.success()
  next()
}