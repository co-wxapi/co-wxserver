var redis = require('./redis');
var wechat = require('./wechat');
var config = require('./config');

module.exports = {
  redis: redis,
  wechat: wechat,
  config: config
};
