/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:37:01
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-21 10:51:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var bu = module.exports = {};

const EventEmitter = require('eventemitter3');

global.cluster = require('./cluster.js');

bu.emitter = new EventEmitter();
bu.init = () => {
    global.r = require('rethinkdbdash')({
        host: config.db.host,
        db: config.db.database,
        password: config.db.password,
        user: config.db.user,
        port: config.db.port,
        max: 50,
        buffer: 5,
        timeoutError: 10000
    });
    bu.trello = new dep.Trello(config.general.trellokey, config.general.trellotoken);
    const Manager = require('./Manager.js');
    global.UtilManager = new Manager('utils');
};