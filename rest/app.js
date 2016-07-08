'use strict';
var hub   = require('../hub');
var store = require('../store');
var crypt = require('../utils/crypt');

class App {
  route(ctx){
    ctx.all(this.register, {
        comment: 'Register a new app',
        validate: true,
        args : [
          ctx.arg('appid', 'string', 'App identifier'),
          ctx.arg('appname', 'string', 'App name', true),
          ctx.arg('appkey', 'string', 'App secret key used for encryption'),
          ctx.arg('skey', 'string', 'Server key to register app')
        ]
      })
      .all(this.unregister, {
          comment: 'Unregister a new app',
          validate: true,
          args : [
            ctx.arg('appid', 'string', 'App identifier'),
            ctx.arg('appkey', 'string', 'App secret key used for encryption'),
            ctx.arg('skey', 'string', 'Server key to register app')
          ]
        })
      .all(this.change, {
          comment: 'change app key',
          validate: true,
          args : [
            ctx.arg('appid', 'string', 'App identifier'),
            ctx.arg('appkey', 'string', 'Old app key'),
            ctx.arg('newkey', 'string', 'New app key')
          ]
        })
      .all(this.oauthRegister, {
        comment: 'Register oauth callback',
        validate: true,
        args : [
          ctx.arg('appid', 'string', 'App identifier'),
          ctx.arg('appkey', 'string', 'App secret key'),
          ctx.arg('state', 'string', 'State value'),
          ctx.arg('redirect', 'string', 'url to redirect')
        ]
      })
      .all(this.oauthUnregister, {
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

  *checkApp(args){
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

  *register(args){
    if ( args.skey != hub.config.skey ) {
      this.throw('Server key invalid!');
    }
    var hasApp = yield store.app.has(args);
    if ( hasApp ) {
      this.throw('App exists!');
    }
    var params = {
      appid: args.appid,
      appkey: this.hash(args.appkey),
      appname: args.appname
    }
    yield store.app.save(params);
    return 'Succeeded';
  }

  *change(args){
    var app = yield this.checkApp(args);
    app.appkey = this.hash(args.newkey);
    yield store.app.save(app);
    return 'Succeeded';
  }

  *unregister(args){
    if ( args.skey != hub.config.skey ) {
      this.throw('Server key invalid!');
    }
    var app = yield this.checkApp(args);
    yield store.app.delete(args);
    return 'Succeeded';
  }

  *oauthRegister(args){
    var app = yield this.checkApp(args);
    if ( yield store.oauth.canRegister(args) ) {
      yield store.oauth.register(args);
    }
    else {
      this.throw('Oauth redirect url not own by you - '+args.state);
    }
    return 'Succeeded';
  }

  *oauthUnregister(args){
    var app = yield this.checkApp(args);
    if ( yield store.oauth.canRegister(args) ) {
      yield store.oauth.unregister(args);
    }
    else {
      this.throw('Oauth redirect url not own by you - '+args.state);
    }
    return 'Succeeded';
  }

  *all(args){
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

  hash(val){
    return crypt.hash(val);
  }
}

module.exports = new App();
