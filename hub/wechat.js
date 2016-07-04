'use strict';
var wxapi = require('co-wxapi');
var fs = require('fs');
var path = require('path');
var token = require('../store/token');
var config = null;

try {
  var data = fs.readFileSync(path.join(__dirname, '../.wxrc'));
  config = JSON.parse(data);
}
catch(err) {
  console.log('Parse wechat configuration file failed!');
}
if ( config == null ) {
  throw new Error('Wechat API not configured!');
}

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
for ( var wxapp in config ){
  var wxconfig = config[wxapp];
  apis[wxapp] = wxapi(wxconfig);
  apis[wxapp].setTokenProvider(new TokenProvider(wxconfig));
  if ( !firstApp ) firstApp = wxapp;
}

if ( !apis[0] && firstApp ) {
  apis[0] = apis[firstApp];
}
module.exports = apis;
