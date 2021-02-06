/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:26:13
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-04-05 15:32:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

global.config = require('../config.json');
const CatLoggr = require('cat-loggr');
const snekfetch = require('snekfetch');
const moment = require('moment');

const loggr = new CatLoggr({
    shardId: 'MS',
    level: config.general.loglevel || 'info',
    shardLength: 6,
    levels: [
        { name: 'fatal', color: CatLoggr._chalk.red.bgBlack, err: true },
        { name: 'error', color: CatLoggr._chalk.black.bgRed, err: true },
        { name: 'warn', color: CatLoggr._chalk.black.bgYellow, err: true },
        { name: 'trace', color: CatLoggr._chalk.green.bgBlack, trace: true },
        { name: 'website', color: CatLoggr._chalk.black.bgCyan },
        { name: 'ws', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'cluster', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'worker', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'command', color: CatLoggr._chalk.black.bgBlue },
        { name: 'irc', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'shardi', color: CatLoggr._chalk.blue.bgYellow },
        { name: 'init', color: CatLoggr._chalk.black.bgBlue },
        { name: 'info', color: CatLoggr._chalk.black.bgGreen },
        { name: 'output', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'bbtag', color: CatLoggr._chalk.black.bgGreen },
        { name: 'verbose', color: CatLoggr._chalk.black.bgCyan },
        { name: 'adebug', color: CatLoggr._chalk.cyan.bgBlack },
        { name: 'debug', color: CatLoggr._chalk.magenta.bgBlack, aliases: ['log', 'dir'] },
        { name: 'database', color: CatLoggr._chalk.black.bgBlue },
        { name: 'module', color: CatLoggr._chalk.black.bgBlue }
    ]
}).setGlobal();

console.info(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

MAIN PROCESS INITIALIZED

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`);

const start = moment();

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

const reload = require('require-reload')(require);
const EventEmitter = require('eventemitter3');
global.Promise = require('bluebird');
const botEmitter = new EventEmitter();
const ClusterManager = require('./core/ClusterManager');
const Eris = require('eris');
// const irc = require('./core/irc.js');

/** CONFIG STUFF **/

global.bu = require('./core/util.js');
bu.init();

/** LOGGING STUFF **/
var VERSION = config.version;


/**
 * Time to init the bots
 */
class BlargbotClient {
    constructor() {
        // todo: make these not global because ew
        this.discord = this.bot = global.bot = new Eris(config.discord.token, {
            restMode: true, defaultImageFormat: 'png'
        });
        // this.irc = irc;
        this.spawner = global.spawner = new ClusterManager(this);

        console.init('Initializing discord.');
        this.spawner.spawnAll();
        // irc.init(VERSION, botEmitter);
        // console.verbose('IRC finished?');

        this.spawnWebsite();
    }

    spawnWebsite() {
        this.Frontend = reload('./frontend');
        this.frontend = new this.Frontend(this);
        this.backend = reload('./backend/main.js');
        this.backend.init();
    }

    async restartWebsite() {
        reload.emptyCache(this.frontend.requireCtx);
        reload.emptyCache(this.backend.requireCtx);
        console.website('Websites are GOING DOWN!');
        await Promise.all([this.frontend.stop(), this.backend.stop()]);
        console.website('Starting sites back up...');
        this.spawnWebsite();
    }
}

botEmitter.on('ircInit', () => {
    console.init('Discord ready. Time to initialize IRC.');
    irc.init(VERSION, botEmitter);
});

botEmitter.on('reloadBu', () => {
    global.bu = reload('./util.js');
});

const cassandra = require('cassandra-driver');
if (config.cassandra) {
    const cclient = new cassandra.Client({
        contactPoints: config.cassandra.contactPoints, keyspace: config.cassandra.keyspace,
        authProvider: new cassandra.auth.PlainTextAuthProvider(config.cassandra.username, config.cassandra.password)
    });
    cclient.execute(`
    CREATE TABLE IF NOT EXISTS chatlogs (
        id BIGINT,
        channelid BIGINT,
        guildid BIGINT,
        msgid BIGINT,
        userid BIGINT,
        content TEXT,
        msgtime TIMESTAMP,
        embeds TEXT,
        type INT,
        attachment TEXT,
        PRIMARY KEY ((channelid), id)
    ) WITH CLUSTERING ORDER BY (id DESC);
    `)
        .then(res => {
            return cclient.execute(`
            CREATE TABLE IF NOT EXISTS chatlogs_map (
                id BIGINT,
                msgid BIGINT,
                channelid BIGINT,
                PRIMARY KEY ((msgid), id)
            ) WITH CLUSTERING ORDER BY (id DESC);
            `);
        })
        .then(res => {
            return cclient.execute(`
            CREATE TABLE IF NOT EXISTS message_outputs (
                id BIGINT PRIMARY KEY,
                content TEXT,
                embeds TEXT,
                channelid BIGINT,
            )`);
        }).catch(err => {
            console.error(err.message, err.stack);
        });
}

if (!config.general.isbeta)
    snekfetch.post(`https://discordapp.com/api/channels/${config.discord.channels.botlog}/messages`)
        .set('Authorization', config.discord.token)
        .send({ content: 'My master process just initialized ' + start.format('[on `]MMMM Do, YYYY[` at `]hh:mm:ss.SS[`]') + '.' })
        .catch(err => {
            console.error('Could not post startup message', err);
        })
        .finally(() => {
            new BlargbotClient();
        });
else {
    new BlargbotClient();
}