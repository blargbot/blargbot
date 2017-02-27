/**
 * Blargbot and stuff
 * made by stupid cat and stuff
 * yeah
 */

const Core = require('./Core');

global.config = require('./Data/config.json');
config.avatars = require(config.general.isbeta ? './Data/avatarsBeta.json' : './Data/avatars.json');