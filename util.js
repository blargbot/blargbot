/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:37:01
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-05 16:43:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var bu = module.exports = {};

const loggerModule = require('./logger.js');
const EventEmitter = require('eventemitter3');

loggerModule.init();
global.cluster = require('./cluster.js');

bu.emitter = new EventEmitter();
bu.init = () => {
    global.r = require('rethinkdbdash')({
        host: config.db.host,
        db: config.db.database,
        password: config.db.password,
        user: config.db.user,
        port: config.db.port,
        max: 100,
        buffer: 5,
        timeoutError: 10000
    });
    bu.trello = new dep.Trello(config.general.trellokey, config.general.trellotoken);
    const Manager = require('./Manager.js');
    global.UtilManager = new Manager('utils');
};