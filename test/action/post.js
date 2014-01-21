'use strict';
exports.name = 'post'
exports.description = 'Test Express Post Actions'
exports.run = function(apx,req,res,next){
  res.success()
  next()
}