'use strict';
var debug = require('debug')('wxserver:msg');
var xml2js = require('xml2js');
var dump = require('./dump');
var hub = require('../hub');
var store = require('../store');
var _Base = require('./_base');
var crypt = require('../utils/crypt');

class Msg extends _Base {
  *recv(args, ctx){
    var type = args.MsgType;
    var account = args.ToUserName;
    var api = hub.wechat.getByAccount(account);
    if ( api ){
      var wxapp = api.wxapp;
      var params = {wxapp:wxapp, type:type};
      var config = yield store.msg.get(params);
      if ( config ) {
        var data = {
          ts: new Date().getTime(),
          wxapp: wxapp,
        }
        var reqParams = {
          url: config.url,
          method: 'POST',
          json: true,
          body: data
        }
        var app = yield store.app.get(config);

        if ( config.encrypt ) {
          data.data = crypt.encrypt(app.appkey, JSON.stringify(msg));
        }
        else {
          data.data = args;
        }
        var body = yield this.request(reqParams);
        return body;
      }
    }
    return yield dump.msg(args, ctx, api);
  }

  *send(args){

  }

  *register(args, ctx){
    var app = yield this._checkApp(args);
    var params = Object.assign({}, args);
    var api = hub.wechat.get(args.wxapp);
    params.wxapp = api.wxapp;
    yield store.msg.register(params);
    return 'Succeeded';
  }

  *unregister(args, ctx){
    var api = yield this._checkApp(args);
    yield store.msg.unregister(args);
    return 'Succeeded';
  }

  *all(args, ctx){
    var data = yield store.msg.list(args);
    return data;
  }

  parse(xml){
    return function co_parseXml(callback){
      var parser = new xml2js.Parser({
        explicitArray: false,
        explicitRoot: false
      });
      parser.parseString(xml, function (err, result) {
        if ( err ) callback(err);
        else callback(null, result);
      });
    }
  }

  build(json) {
    return function co_buildXml(callback){
      var builder = new xml2js.Builder({
        rootName: 'xml',
        headless: true,
        cdata: false
      });
      var xml = builder.buildObject(json);
      callback(null, xml);
    }
  }
}

module.exports = new Msg();
