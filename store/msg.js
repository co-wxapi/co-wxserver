'use strict';

const REDIS_KEY = 'wxapp::msgs';
const hub = require('../hub');
const redis = hub.redis;

function makeKey(wxapp, type) {
  return 'wxapp:msg:'+wxapp+':'+type;
}

exports.register = function* registerMsgHandler(args){
  var type = args.type || '*';
  var appid = args.appid;
  var wxapp = args.wxapp;
  var url = args.url;
  var subKey = makeKey(wxapp, type);
  var params = {
    appid: appid,
    type : type,
    url  : url,
  }
  if ( args.encrypt ) params.encrypt = args.encrypt;
  if ( wxapp ) params.wxapp = wxapp;
  yield redis.hset(REDIS_KEY, subKey, JSON.stringify(params));
}

exports.unregister = function* unregisterMsgHandler(args){
  var type = args.type || '*';
  var wxapp = args.wxapp;
  var subKey = makeKey(wxapp, type);
  yield redis.hdel(REDIS_KEY, subKey);
}

exports.get = function* getMsgHandleUrl(args){
  var wxapp = args.wxapp;
  var type = args.type;
  var subKey = makeKey(wxapp, type);
  var config = yield redis.hget(REDIS_KEY, subKey);
  if ( config ) {
    return JSON.parse(config);
  }
  return config;
}

exports.list = function* getMsgHandleUrl(args){
  var data = [];
  var config = yield redis.hgetall(REDIS_KEY);
  for ( var key in config ) {
    data.push(config[key]);
  }
  return data;
}
