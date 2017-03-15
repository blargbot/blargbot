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
        _logger.debug('Max:', process.env.SHARD_MAX, 'ID:', process.env.SHARD_ID);
        super(_config.discord.token, {
            autoreconnect: true,
            disableEveryone: true,
            disableEvents: {
                TYPING_START: true
            },
            getAllUsers: true,
            maxShards: parseInt(process.env.SHARD_MAX),
            firstShardID: parseInt(process.env.SHARD_ID),
            lastShardID: parseInt(process.env.SHARD_ID),
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

var discord = new DiscordClient();
discord.sender.send('threadReady', process.env.SHARD_ID);

process.on('message', async msg => {
    const message = JSON.parse(msg);
    switch (message.code) {
        case 'await':
            const eventKey = 'await:' + message.data.key;
            switch (message.data.message) {
                case 'connect':
                    discord.on('ready', () => _logger.init('Ready, but not through the event system.'));
                    discord.on('error', (err) => _logger.error(err));
                    _logger.init('Connecting');
                    await discord.connect();
                    discord.sender.send(eventKey, true);
                    break;
                case 'shardStatus':
                    let shards = discord.shards.map(s => {
                        return { id: s.id, status: s.status };
                    });
                    discord.sender.send(eventKey, {
                        guilds: discord.guilds.size,
                        shards,
                        id: process.env.SHARD_ID
                    });
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
