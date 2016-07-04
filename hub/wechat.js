'use strict';
var wxapi = require('co-wxapi');
var fs = require('fs');
var path = require('path');
var token = require('../store/token');

class TokenProvider {
  constructor(config){
    this.config = config;
    this.data = {
      expire: 0
    };
  }

  *checkExpired(){
    var now = new Date().getTime();
    if ( now > this.data.expire ) {
      var data = yield token.get({wxappid: this.config.appid});
      if ( data != null ) {
        this.data = data;
      }
      else {
        console.error('Get latest wechat access token failed!');
        return false;
      }
    }
    return true;
  }

  *getAccessToken(){
    yield this.checkExpired();
    return this.data.token;
  }

  *getJSAPITicket(){
    yield this.checkExpired();
    return this.data.ticket;
  }
}

var apis = {};
var firstApp = null;

function setupWeixin(config){
  for ( var wxapp in config ){
    var wxconfig = config[wxapp];
    apis[wxapp] = wxapi(wxconfig);
    apis[wxapp].wxapp = wxapp;
    apis[wxapp].setTokenProvider(new TokenProvider(wxconfig));
    if ( !firstApp ) firstApp = wxapp;
  }

  if ( !apis[0] && firstApp ) {
    apis[0] = apis[firstApp];
  }
}


var findPaths = [path.join(__dirname, '../.wxrc'), path.join(__dirname, '../etc/wxrc'), '/etc/wxrc'];
var config = null;
for ( var i = 0; i < findPaths.length; ++ i ) {
  var findPath = findPaths[i];
  try {
    var data = fs.readFileSync(findPath);
    config = JSON.parse(data);
    break;
  }
  catch(err) {
    console.warn('Can not loading wechat configuration - '+findPath);
  }
}
if ( config == null ) {
  throw new Error('Wechat API not configured!');
}
setupWeixin(config);
module.exports = apis;
