'use strict';
exports.name = 'getMethods'
exports.description = 'Test Express with Verb Routes and Methods'
exports.run = function(apx,req,res,next){
  next('no default for the run method')
}
exports.test = function(apx,req,res,next){
  res.set('foo','bar')
  next()
}