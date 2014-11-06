var extend = require('util')._extend;

module.exports = {
  skypedb: '/home/user/.Skype/user/main.db',
  io: 'http://localhost:3000',
  wait: 500
};

// deploy settings
try {
  var config = require('../config');
  extend(module.exports, config);
} catch(e) { }

// local dev settings
try {
  var config = require('./config_local');
  extend(module.exports, config);
} catch(e) { }
