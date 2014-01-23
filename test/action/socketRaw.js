'use strict';
var expect = require('chai').expect
exports.name = 'socketRaw'
exports.description = 'Test Socket.IO Responses using Raw responses'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('raw')
  res.add('foo bar baz')
  next()
}