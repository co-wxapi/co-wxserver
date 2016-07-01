'use strict';
var crypto = require('crypto');

exports.hash = function hashCode(val){
  return crypto.createHash('sha1').update(val).digest('hex');
}

exports.encrypt = function* encrypt(key, val){
  const cipher = crypto.createCipher('aes192', key);
  var data = cipher.update(val, 'utf8', 'hex')
  data += cipher.final('hex');
  return data;
}

exports.decrypt = function* decrypt(key, val){
  const decipher = crypto.createDecipher('aes192', key);
  var data = decipher.update(val, 'hex', 'utf8')
  data += decipher.final('utf8');
  return data;
}
