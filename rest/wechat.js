'use strict';

var store = require('../store');
var hub   = require('../hub');
var crypt = require('../utils/crypt');

class WeChat {
  getApi(wxapp, ctx){
    wxapp = wxapp || '0';
    var api = hub.wechat[wxapp];
    if ( !api ) {
      ctx.throw('Wechat account of '+wxapp+' not configured!');
    }
    return api;
  }

  *oauth(args, ctx){
    var state = args.state;
    var more = !!args.more;
    var wxapp = args.wxapp;
    var host = ctx.get('host');
    if ( !host ) {
      throw new Error('Can not get host header!');
    }
    if ( !wxapp || !state ) {
      this.throw('Missing params - state,wxapp', 400);
      return;
    }
    var redirectUrl = 'http://'+host+'/wechat/redirect';
    var api = this.getApi(wxapp, ctx);
    var url = yield api.auth.getAuthUrl(redirectUrl, state, more);
    ctx.redirect(url);
  }

  *redirect(args, ctx){
    var state = args.state;
    var code = args.code;
    if ( !state ) {
      this.throw('State is not provided!', 400);
      return;
    }
    var config = yield store.oauth.get(args);
    if ( !config || !config.redirect ) {
      this.throw('Url for '+state+' not registered!', 400);
    }
    var app = yield store.app.get(config);
    var url = config.redirect;
    var wxapp = config.wxapp;
    var api = this.getApi(wxapp, ctx);
    var token = yield api.auth.getAuthToken(code);
    var timestamp = new Date().getTime();
    var data = yield api.auth.getUserInfo(token.access_token, token.openid);
    if ( url.indexOf('?') < 0 ) {
      url += '?ts='+timestamp;
    }
    else {
      url += '&ts='+timestamp;
    }
    url += '&wxapp='+api.wxapp;
    if ( data ) {
      data.wxapp = api.wxapp;
      data.wxappid = api.appId;
      data.ts = timestamp;
      url += '&data='+crypt.encryt(app.appkey, JSON.stringify(data));
    }
    console.log(url);
    ctx.redirect(url);
  }

  *wxconfig(args, ctx){
    var url = args.url || ctx.get('referer');
    var wxapp = args.wxapp || '0';
    if ( url == null ) {
      this.throw('Url is not provided!', 400);
    }
    var api = this.getApi(wxapp, ctx);
    var config = yield api.jsapi.wxConfig(url);
    ctx.type = 'application/javascript';
    ctx.body = 'wx.config('+JSON.stringify(config)+')';
  }


  *all(args){
    var apps = hub.wechat;
    var data = {};
    for ( var key in apps ) {
      if ( key == '0' ) continue;
      var api = apps[key];
      data[key] = {
        appid: api.appId
      };
    }
    console.log(data);
    return data;
  }
}

module.exports = new WeChat();
