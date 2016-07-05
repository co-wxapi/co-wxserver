'use strict';
var crypto = require('crypto');

exports.hash = function hashCode(val){
  return crypto.createHash('sha1').update(val).digest('hex');
}

exports.encrypt = function* encrypt(key, val){
  if ( val == null ) return val;
  const cipher = crypto.createCipher('aes192', key);
  var data = cipher.update(val, 'utf8', 'base64')
  data += cipher.final('base64');
  data = data.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return data;
}

exports.decrypt = function* decrypt(key, val){
  if ( val == null ) return val;
  const decipher = crypto.createDecipher('aes192', key);
  var data = val.replace(/-/g, '+').replace(/_/g, '/');
  while (data.length % 4)
    data += '=';
  var data = decipher.update(val, 'base64', 'utf8')
  data += decipher.final('utf8');
  return data;
}

exports.urlEncode = function (unencoded) {
  var encoded = base64.encode(unencoded);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

exports.urlDecode = function(encoded) {
  encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (encoded.length % 4)
    encoded += '=';
  return base64.decode(encoded);
};
