/**
 * Blargbot and stuff
 * made by stupid cat and stuff
 * yeah
 */

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Promise Rejection:', reason || p);
});
process.env.SHARD_ID = -1;

global.Promise = require('bluebird');
global._config = require('./config.json');

global._core = require('./Core');

global._constants = _core.Constants;
global._logger = new _core.Logger();
//_config.avatars = require(_config.general.isbeta ? './Data/avatarsBeta.json' : './Data/avatars.json');

process.env['SHARD_ID'] = -1;

global._client = new _core.Client();

_client.init();
