'use strict';
exports.name = 'options'
exports.description = 'Test options requests on URIs'
exports.run = function(apx,req,res,next){
  res.success()
  next()
}