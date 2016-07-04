var client = require('redis').createClient();
var redisConnection = require('co-redis')(client);

module.exports = redisConnection;
