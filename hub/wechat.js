'use strict';
var wxapi = require('co-wxapi');
var fs = require('fs');
var path = require('path');
var config = require('./config');
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

function setupWeixin(accounts){
  for ( var wxapp in accounts ){
    var wxconfig = accounts[wxapp];
    apis[wxapp] = wxapi(wxconfig);
    apis[wxapp].wxapp = wxapp;
    apis[wxapp].setTokenProvider(new TokenProvider(wxconfig));
    if ( !firstApp ) firstApp = wxapp;
  }

  if ( !apis[0] && firstApp ) {
    apis[0] = apis[firstApp];
  }
}


setupWeixin(config.accounts);
module.exports = apis;
