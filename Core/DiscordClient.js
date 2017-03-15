global._dep = require('../Dependencies');

const { CommandManager, EventManager } = require('./Managers');
const { Cache } = require('./Structures');

global.Promise = require('bluebird');
global._config = require('../config.json');
global._r = _dep.rethinkdbdash(_config.db);
require('../Prototypes');
global._core = require('../Core');

global._cache = {
    User: new Cache('user'),
    Guild: new Cache('guild'),
    Tag: new Cache('tag')
};

global._constants = _core.Constants;
global._logger = new _core.Logger();

class DiscordClient extends _dep.Eris.Client {
    constructor() {
        super(_config.discord.token, {
            autoReconnect: true,
            disableEveryone: true,
            disableEvents: {
                TYPING_START: true
            },
            getAllUsers: true,
            maxShards: process.env.SHARD_MAX,
            firstShardId: process.env.SHARD_ID,
            lastShardId: process.env.SHARD_ID,
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 512,
            messageLimit: 1
        });

        global._discord = this;
        this.Core = require('./index.js');

        this.CommandManager = new CommandManager();
        this.CommandManager.init();

        this.EventManager = new EventManager();
        this.EventManager.init();

        this.sender = new _core.Structures.Sender(process);

        this.emitter = new _dep.EventEmitter();

        this.emitter.on('eval', (channelId, code) => {
            doEval(channelId, code);
        });
    }
}

var discord;

process.on('message', async msg => {
    const message = JSON.parse(msg);
    switch (message.code) {
        case 'await':
            const eventKey = 'await:' + message.data.key;
            switch (message.data.message) {
                case 'construct':
                    discord = new DiscordClient();
                    discord.sender.send(eventKey, true);
                    break;
                case 'connect':
                    discord.on('ready', () => console.log('Ready, but not through the event system.'));
                    await discord.connect();
                    discord.sender.send(eventKey, true);
                    break;
            }
            break;
    }
});

async function doEval(channelId, code) {
    const toExecute = eval(`async function() {
        ${code}
    }`);
    const response = await toExecute();
    return await _discord.Core.Helpers.Message.send(channelId,
        _dep.util.inspect(response, { depth: 1 }));
}



module.exports = DiscordClient;
