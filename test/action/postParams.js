'use strict';
var expect = require('chai').expect
exports.name = 'postParams'
exports.description = 'Test Express Post Action with Params'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('bar')
  res.success()
  next()
}