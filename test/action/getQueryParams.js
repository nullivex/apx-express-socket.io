'use strict';
var expect = require('chai').expect
exports.name = 'getQueryParams'
exports.description = 'Test actions with query params'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('bar')
  res.success()
  next()
}