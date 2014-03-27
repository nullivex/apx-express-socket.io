'use strict';
exports.name = 'rawReqRes'
exports.description = 'Test existence of raw request and response vars'
exports.run = function(apx,req,res,next){
  res.set('reqExists',('object' === typeof req.raw.req))
  res.set('resExists',('object' === typeof req.raw.res))
  next()
}