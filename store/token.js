'use strict';
var redis = require('../hub/redis');
const REDIS_KEY = 'WXAPP:TOKEN';
class Token {
  *save(args){
    var appid = args.wxappid;
    var params = {
      token: args.token,
      ticket: args.ticket,
      expire: args.expire,
      timestamp: new Date().getTime()
    }
    yield redis.hset(REDIS_KEY, appid, JSON.stringify(params));
  }

  *get(args){
    var appid = args.wxappid;
    var token = yield redis.hget(REDIS_KEY, appid);
    if ( token ) {
      return JSON.parse(token);
    }
    return null;
  }
}

module.exports = new Token();
