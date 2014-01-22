'use strict';
var expect = require('chai').expect
  , temp = require('temp')
  , fs = require('fs')
exports.name = 'socketFile'
exports.description = 'Test Socket.IO Responses using File responses'
exports.run = function(apx,req,res,next){
  expect(req.get('foo')).to.equal('file')
  var tmpFile = temp.openSync()
  fs.writeSync(tmpFile.fd,'foo')
  res.sendFile(tmpFile.path,'foo.txt',{tmpFile: true})
  next()
}