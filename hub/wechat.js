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
var defaultApp = null;

function setupWeixin(accounts){
  var count = 0;
  for ( var wxapp in accounts ){
    var item = accounts[wxapp];
    var wxconfig = {
      appid: item.appid || item.appId ||  item.app_id,
      appkey: item.appkey || item.appKey || item.app_key || item.appSecret || item.app_secret,
      comment: item.comment || item.desc || item.description,
      timeout: item.timeout,
      type : item.type,
      default: !!item.default
    };
    apis[wxapp] = wxapi(wxconfig);
    apis[wxapp].wxapp = wxapp;
    apis[wxapp]._wxconfig = wxconfig;
    apis[wxapp].setTokenProvider(new TokenProvider(wxconfig));
    if ( item.default ) defaultApp = wxapp;
    count++;
  }

  if ( !count ) {
    throw new Error('No wechat account in configuration!');
  }
}

setupWeixin(config.accounts);

exports.get = function getWxapi(wxapp){
  var api = apis[wxapp];
  if (!api) api = apis[defaultApp];
  return api;
}

exports.getConfig = function getWxapiConfig(wxapp){
  return config.accounts[wxapp];
}

exports.all = function allWxapps(){
  return Object.keys(apis);
}
