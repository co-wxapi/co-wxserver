'use strict';
var store = require('../store');
var crypt = require('../utils/crypt');
var _request = require('request');

class _Base {
  *_checkApp(args){
    var app = yield store.app.get(args);
    if ( !app ) {
      this.throw('App['+args.appid+'] not exits!');
    }
    var hash = this.hash(args.appkey);
    if ( hash != app.appkey ) {
      this.throw('Key not match!');
    }
    return app;
  }

  request(args){
    return function co_request_wrapper(callback){
      _request(args, function(err, resp, body){
        if ( err ) callback(err);
        else {
          if ( resp.statusCode != 200 ) {
            var err = new Error(resp.text || resp.body || resp.statusText || resp.statusMessage);
            callback(err);
          }
          else {
            callback(null, body);
          }
        }
      });
    }
  }

  hash(key){
    return crypt.hash(key);
  }
}

module.exports = _Base;
