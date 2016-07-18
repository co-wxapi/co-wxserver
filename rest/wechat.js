'use strict';

var store = require('../store');
var hub   = require('../hub');
var crypt = require('../utils/crypt');

class WeChat {
  getApi(wxapp, ctx){
    var api = hub.wechat.get(wxapp);
    if ( !api ) {
      ctx.throw('Wechat account of '+wxapp+' not configured!');
    }
    return api;
  }

  *oauth(args, ctx){
    var state = args.state;
    var more = true;
    if ( args.more != null && !args.more ) {
      more = false;
    }
    var host = ctx.get('host');
    if ( !host ) {
      throw new Error('Can not get host header!');
    }
    if ( !state ) {
      this.throw('Missing params - state', 400);
      return;
    }
    var stateCfg = yield store.oauth.get(args);
    var redirectUrl = 'http://'+host+'/wechat/token';
    var api = this.getApi(stateCfg.wxapp, ctx);
    var url = yield api.auth.getAuthUrl(redirectUrl, state, more);
    ctx.redirect(url);
  }

  *token(args, ctx){
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
    var wxconfig = hub.wechat.getConfig(wxapp);
    var token = yield api.auth.getAuthToken(code);
    var timestamp = new Date().getTime();
    var data = token;
    if ( url.indexOf('?') < 0 ) {
      url += '?ts='+timestamp;
    }
    else {
      url += '&ts='+timestamp;
    }
    if ( data ) {
      data.wxapp = wxapp;
      data.wxappid = api.appId;
      data.ts = timestamp;
      if ( wxconfig.encrypt ) {
        var encData = yield crypt.encrypt(app.appkey, JSON.stringify(data));
        url += '&data='+ encData;
      }
      else {
        url += '&data='+encodeURIComponent(JSON.stringify(data));
      }
    }
    if ( config.debug ) {
      var host = ctx.get('host');
      var userUrl = 'http://'+host+'/wechat/user?access_token='+token.access_token+'&openid='+token.openid+'&wxapp='+wxapp;
      ctx.body = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <ul>
      <li>State: ${state}</li>
      <li>Token: ${JSON.stringify(token)}</li>
      <li>Redirect: <a href="${url}">${url}</a></li>
      <li>User: <a href="${userUrl}">${userUrl}</a></li>
    </ul>
  </body>
</html>`
    }
    else{
      ctx.redirect(url);
    }
  }

  *user(args, ctx){
    var wxapp = args.wxapp;
    var token = args.token || args.access_token;
    var lang  = args.lang;
    var openid = args.openid;
    if ( !token || !openid ) {
      this.throw('Access token or openid is not provided!', 400);
      return;
    }
    var api = this.getApi(wxapp, ctx);
    var wxconfig = hub.wechat.getConfig(wxapp);
    var timestamp = new Date().getTime();
    var user = yield api.auth.getUserInfo(token, openid, lang);
    var data = {};
    if ( user ) {
      data.wxappid = api.appId;
      data.ts = timestamp;
      if ( wxconfig.encrypt ) {
        data.user = yield crypt.encrypt(app.appkey, JSON.stringify(user));
      }
      else {
        data.user = user;
      }
    }
    return data;
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

  *qrcode(args, ctx) {
    var api = this.getApi(args.wxapp, ctx);
    var sceneId = args.scene_id || args.sceneId || args.sceneid;
    if ( sceneId == null ) {
      this.throw("Missing parameter sceneid");
    }
    if ( !isNaN(parseInt(sceneId)) ) {
      sceneId = parseInt(sceneId);
    }
    var expire = parseInt(args.expire) || null;
    var ticket = yield api.qrcode.getTicket(sceneId, expire);
    var imageData = yield api.qrcode.getQRCode(ticket.ticket);
    ctx.type = 'image/png';
    ctx.body = imageData;
  }

  *shorturl(args, ctx){
    var api = this.getApi(args.wxapp, ctx);
    var result = yield api.qrcode.getShortUrl(args.url);
    return result;
  }

  *upload(args, ctx){
    if ( !args.url ) this.throw('Missing parameter url!', 400);
    var api = this.getApi(args.wxapp, ctx);
    var result = yield api.asset.upload(args.url, args.type || 'image');
    return result;
  }

  *download(args, ctx){
    var mediaId = args.mediaId || args.media_id || args.mediaid;
    if ( !mediaId ) this.throw('Missing parameter mediaId!', 400);
    var api = this.getApi(args.wxapp, ctx);
    var data = yield api.asset.download(mediaId);
    ctx.type = data.headers && data.headers['content-type'];
    ctx.body = data;
  }

  *all(args){
    var wxapps = hub.wechat.all();
    var data = {};
    for ( var i = 0; i < wxapps.length; ++i ) {
      var wxapp = wxapps[i];
      var wxcfg = hub.wechat.getConfig(wxapp);

      data[wxapp] = {
        comment: wxcfg.comment,
        appid: wxcfg.appId,
        type : wxcfg.type
      };
      if ( wxcfg.default ) {
        data[wxapp].default = true;
      }
    }
    return data;
  }
}

module.exports = new WeChat();
