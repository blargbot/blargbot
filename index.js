/**
 * Blargbot and stuff
 * made by stupid cat and stuff
 * yeah
 */
global._dep = require('./Dependencies');
global._core = require('./Core');
global._config = require('./config.json');
global._constants = _core.Constants;
//_config.avatars = require(_config.general.isbeta ? './Data/avatarsBeta.json' : './Data/avatars.json');

global._client = new _core.Client();