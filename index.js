/**
 * Blargbot and stuff
 * made by stupid cat and stuff
 * yeah
 */

process.on('unhandledRejection', (err, p) => {
  console.error('Unhandled Promise Rejection:', err.stack);
});

process.env.SHARD_ID = -1;

global.Promise = require('bluebird');
global._config = require('./config.json');

const core = require('./Core');

new core.Logger('MS', _config.log.level || 'info').setGlobal();
//_config.avatars = require(_config.general.isbeta ? './Data/avatarsBeta.json' : './Data/avatars.json');

process.env['SHARD_ID'] = -1;

const client = new core.Client();

client.init();
