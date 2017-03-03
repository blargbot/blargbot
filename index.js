/**
 * Blargbot and stuff
 * made by stupid cat and stuff
 * yeah
 */
global._dep = require('./Dependencies');
const Core = require('./Core');

global._config = require('./Data/config.json');
global._constants = Core.Constants;
config.avatars = require(_config.general.isbeta ? './Data/avatarsBeta.json' : './Data/avatars.json');