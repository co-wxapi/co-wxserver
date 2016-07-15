'use strict';

class Dump {
  formatMessage(msg, body){
    var summary = {};
    var items = [summary];
    summary.Title = 'Received ['+msg.MsgType+'] message';
    summary.Description = body;
    summary.Url = 'http://mp.weixin.qq.com/wiki/17/f298879f8fb29ab98b2f2971d42552fd.html';
    return items;
  }

  formatEvent(msg, body) {
    var summary = {};
    var items = [summary];
    summary.Title = 'Received event';
    summary.Description = body;
    summary.Url = 'http://mp.weixin.qq.com/wiki/7/9f89d962eba4c5924ed95b513ba69d9b.html';
    return items;
  }

  *msg(args, ctx){
    var params = {
      CreateTime: new Date().getTime(),
      MsgType: args.MsgType
    }
    if ( args.FromUserName ) params.ToUserName = args.FromUserName;
    if ( args.ToUserName ) params.FromUserName = args.ToUserName;
    params.MsgType = 'news';
    if ( args.MsgType == 'news' ) {
      console.log('message', args);
      params = Object.assign({}, args, params);
    }
    else {
      params.Articles = {item: [] };
      if ( args.MsgType == 'event' ) {
        console.log('event', args);
        params.Articles.item = this.formatEvent(args, ctx.request.body);
      }
      else {
        console.log('message', args);
        params.Articles.item = this.formatMessage(args, ctx.request.body);
      }
      params.ArticleCount = params.Articles.item.length;
    }
    return params;
  }

  *echo(args, ctx){
    var params = {
      CreateTime: new Date().getTime(),
      MsgType: args.MsgType
    }
    if ( args.FromUserName ) params.ToUserName = args.FromUserName;
    if ( args.ToUserName ) params.FromUserName = args.ToUserName;
    if ( args.MsgType == 'image' ) {
      params.Image = [{MediaId: args.MediaId}];
    }
    else if ( args.MsgType == 'voice' ) {
      params.Voice = [{MediaId: args.MediaId}];
    }
    else if ( args.MsgType == 'video' || args.MsgType =='shortvideo' ) {
      params.MsgType = 'video';
      params.Video = {
        MediaId: args.MediaId,
        ThumbMediaId: args.ThumbMediaId
        //Title: 'MsgType: ' + args.MsgType,
        //Description: 'ThumbMediaId: ' + args.ThumbMediaId
      };
    }
    else if ( args.MsgType == 'link' ) {
      params.MsgType = 'news';
      params.ArticleCount = 1;
      params.Articles = [{item: {
        Title: args.Title,
        Description: args.Description,
        Url: args.Url
        //PicUrl
      }}]
    }
    else if ( args.MsgType == 'location' ) {
      params.MsgType = 'text';
      params.Content = args.Label +'\n'+ args.Location_X+','+args.Location_Y;
    }
    else {
      params = Object.assign({}, args, params);
      delete params.MsgId;
    }
    return params;
  }
}

module.exports = new Dump();
