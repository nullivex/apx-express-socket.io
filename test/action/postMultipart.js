'use strict';
var expect = require('chai').expect
exports.name = 'postMultipart'
exports.description = 'Test Express Post Action with Params and Files'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('bar')
  expect(req.files[0].name).to.equal('foo.txt')
  expect(req.get('baz[0]')).to.equal('foo')
  res.success()
  next()
}