'use strict';
exports.name = 'get'
exports.description = 'Test get routing'
exports.run = function(apx,req,res,next){
  res.set('foo','bar')
  next()
}