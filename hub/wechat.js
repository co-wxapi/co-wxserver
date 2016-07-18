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

var appMap = {};
var accountMap = {};
var defaultApp = null;

function setupWeixin(accounts){
  var count = 0;
  for ( var i = 0; i < accounts.length; ++ i ){
    var item = accounts[i];
    var wxapp = item.wxapp;
    var wxconfig = {
      appid: item.appid || item.appId ||  item.app_id,
      appkey: item.appkey || item.appKey || item.app_key || item.appSecret || item.app_secret,
      account: item.account,
      comment: item.comment || item.desc || item.description,
      timeout: item.timeout,
      encrypt: item.encrypt,
      debug: !!item.debug,
      type : item.type,
      default: !!item.default
    };
    var api = wxapi(wxconfig);
    api.setTokenProvider(new TokenProvider(wxconfig));
    api.wxapp = wxapp;
    api.wxconfig = wxconfig;
    appMap[wxapp] = api;
    var account = wxconfig.account;
    if ( account ){
      accountMap[account] = api;
    }
    if ( item.default ) defaultApp = wxapp;
    count++;
  }

  if ( !count ) {
    throw new Error('No wechat account in configuration!');
  }
}

setupWeixin(config.accounts);

exports.get = function getWxapi(wxapp){
  var api = appMap[wxapp];
  if (!api) api = appMap[defaultApp];
  return api;
}

exports.getByAccount = function getWxapiByAccount(openid){
  var api = accountMap[openid];
  return api;
}

exports.getConfig = function getWxapiConfig(wxapp){
  var api = this.get(wxapp);
  if ( api ) return api.wxconfig;
  return null;
}

exports.all = function allWxapps(){
  return Object.keys(appMap);
}
