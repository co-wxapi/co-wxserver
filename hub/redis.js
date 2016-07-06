var config = require('./config');
var client = require('redis').createClient(config.redis);
var redisConnection = require('co-redis')(client);

module.exports = redisConnection;
