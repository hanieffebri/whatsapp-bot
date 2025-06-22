const redis = require('redis');
const config = require('../config');
const logger = require('./logger');

const client = redis.createClient({
  url: config.redisUrl
});

client.on('connect', () => {
  logger.info('Connected to Redis');
});

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Promisify Redis methods
['get', 'set', 'del', 'keys', 'expire'].forEach(method => {
  client[`${method}Async`] = function(...args) {
    return new Promise((resolve, reject) => {
      client[method](...args, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  };
});

module.exports = client;