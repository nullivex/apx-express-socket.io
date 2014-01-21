'use strict';
var temp = require('temp')
  , fs = require('fs')
exports.name = 'file'
exports.description = 'Test sending a file'
exports.run = function(apx,req,res,next){
  var tmpFile = temp.openSync()
  fs.writeSync(tmpFile.fd,'foo bar baz')
  res.sendFile(tmpFile.path,'foo.txt',{tmpFile: true})
  next()
}