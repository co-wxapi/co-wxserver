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
          ctx.arg('appkey', 'string', 'App secret key used for encryption')
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
      .all(this.oauth, {
        comment: 'List all registered oauth redirect urls'
      })
  }

  *checkApp(args){
    var app = yield store.app.get(args);
    if ( !app ) {
      this.throw('No app was found!');
    }
    var hash = this.hash(args.appkey);
    if ( hash != app.appkey ) {
      this.throw('Key not match!');
    }
    return app;
  }

  *register(args){
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
    var list = yield store.oauth.list();
    console.log('oauth', list);
    return list || [];
  }

  hash(val){
    return crypt.hash(val);
  }
}

module.exports = new App();
