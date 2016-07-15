'use strict';
var xml2js = require('xml2js');
var dump = require('./dump');

class Msg {
  constructor(){

  }

  *recv(args, ctx){
    return yield dump.msg(args, ctx);
  }

  *send(args){

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
        //cdata: true
      });
      var xml = builder.buildObject(json);
      callback(null, xml);
    }
  }
}

module.exports = new Msg();
