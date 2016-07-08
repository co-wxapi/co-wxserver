'use strict';
const REDIS_KEY = 'wxapp::apps';
var redis = require('../hub/redis');
exports.save = function *saveApp(args){
  var id = args.appid;
  yield redis.hset(REDIS_KEY, id, JSON.stringify(args));
}

exports.get = function *getApp(args){
  var id = args.appid;
  var value = yield redis.hget(REDIS_KEY, id);
  return value==null?null:JSON.parse(value);
}

exports.delete = function *deleteApp(args){
  var id = args.appid;
  var value = yield redis.hdel(REDIS_KEY, id);
  return value==null?null:JSON.parse(value);
}

exports.has = function *hasApp(args) {
  var id = args.appid;
  var value = yield redis.hexists(REDIS_KEY, id);
  return value;
}

exports.list = function *listApp(args){
  var value = yield redis.hgetall(REDIS_KEY);
  if ( !value ) return {};
  return value;
}
