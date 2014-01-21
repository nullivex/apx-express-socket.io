'use strict';
exports.name = 'xml'
exports.description = 'Test XML output'
exports.run = function(apx,req,res,next){
  res.mimeType = 'application/xml'
  res.set('foo','bar')
  res.success()
  next()
}