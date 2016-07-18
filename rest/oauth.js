'use strict';
var store = require('../store');
var _Base = require('./_base');

class OAuth extends _Base {
  route(ctx){
    ctx.all(this.register, {
      comment: 'Register oauth callback',
      validate: true,
      args : [
        ctx.arg('appid', 'string', 'App identifier'),
        ctx.arg('appkey', 'string', 'App secret key'),
        ctx.arg('wxapp', 'string', 'Wechat identifier', true),
        ctx.arg('state', 'string', 'State value'),
        ctx.arg('debug', 'boolean', 'Enable debugging', true),
        ctx.arg('redirect', 'string', 'url to redirect')
      ]
    })
    .all(this.unregister, {
      comment: 'Unregister oauth callback',
      validate: true,
      args : [
        ctx.arg('appid', 'string', 'App identifier'),
        ctx.arg('appkey', 'string', 'App secret key'),
        ctx.arg('state', 'string', 'State value'),
      ]
    })
    .all(this.all, {
      comment: 'List all registered oauth redirect urls'
    })
  }

  *register(args){
    var app = yield this._checkApp(args);
    if ( yield store.oauth.canRegister(args) ) {
      yield store.oauth.register(args);
    }
    else {
      this.throw('Oauth redirect url not own by you - '+args.state);
    }
    return 'Succeeded';
  }

  *unregister(args){
    var app = yield this._checkApp(args);
    if ( yield store.oauth.canRegister(args) ) {
      yield store.oauth.unregister(args);
    }
    else {
      this.throw('Oauth redirect url not own by you - '+args.state);
    }
    return 'Succeeded';
  }

  *all(args, ctx){
    var apps = yield store.app.list() || {};
    var list = yield store.oauth.list();
    var data = {};
    for ( var appid in apps ){
      var app = apps[appid];
      var oauth = list[appid];
      data[appid] = {
        appname: app.appname,
        oauth: oauth
      }
    }
    return data;
  }
}

module.exports = new OAuth();
