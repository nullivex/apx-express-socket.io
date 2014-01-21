'use strict';
exports.name = 'raw'
exports.description = 'Test raw output'
exports.run = function(apx,req,res,next){
  res.add('foo bar baz')
  next()
}