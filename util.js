var bu = module.exports = {};

const loggerModule = require('./logger.js');


loggerModule.init();
global.cluster = require('./cluster.js');

bu.init = () => {
    global.r = require('rethinkdbdash')({
        host: config.db.host,
        db: config.db.database,
        password: config.db.password,
        user: config.db.user,
        port: config.db.port
    });
    bu.trello = new dep.Trello(config.general.trellokey, config.general.trellotoken);
};