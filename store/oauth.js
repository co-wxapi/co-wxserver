'use strict';

const REDIS_KEY = 'WXAPP:STATE:REGISTRY';
var redis = require('../hub/redis');

function appStateKey(appid) {
  return 'WXAPP:STATES:'+appid;
}

exports.register = function* registerOauthRedirectUrl(args){
  var state = args.state;
  var appid = args.appid;
  var redirect = args.redirect;
  var wxapp = args.wxapp;
  var params = {
    appid: appid,
    redirect: redirect
  }
  if ( wxapp ) params.wxapp = wxapp;
  yield redis.hset(REDIS_KEY, state, JSON.stringify(params));
}

exports.canRegister= function* canRegisterState(args){
  var state = args.state;
  var appid = args.appid;
  var config = yield redis.hget(REDIS_KEY, state);
  if ( !config ) return true;
  config = JSON.parse(config);
  return (config.appid == appid );
}

exports.unregister = function* unregisterOauthRedirectUrl(args){
  var state = args.state;
  yield redis.hdel(REDIS_KEY, state);
}

exports.list = function* getAllRegistered(){
  var items = yield redis.hgetall(REDIS_KEY) || {};
  var list = {};
  for ( var state in items ) {
    var item = items[state];
    var config = JSON.parse(item);
    if ( !list[config.appid] ) list[config.appid] = {};
    list[config.appid][state] = config.redirect;
  }
  return list;
}

exports.get = function* getRedirectUrlByState(args){
  var state = args.state;
  var config = yield redis.hget(REDIS_KEY, state);
  if ( config != null ) config = JSON.parse(config);
  return config;
}
