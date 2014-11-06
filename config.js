var extend = require('util')._extend;

module.exports = {
  skypedb: '/home/user/.Skype/user/main.db',
  io: 'http://localhost:3000',
  wait: 500
};

try {
  var config = require('./config_local');
  extend(module.exports, config);
} catch(e) { }

if (process.env.SKYPEDB !== undefined) {
  module.exports.skypedb = process.env.SKYPEDB;
}
