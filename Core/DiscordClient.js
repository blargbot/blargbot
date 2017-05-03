global._dep = require('../Dependencies');

const { CommandManager, EventManager, LocaleManager } = require('./Managers');
const { Cache } = require('./Structures');
const Database = require('./Database');

global.Promise = require('bluebird');
global._config = require('../config.json');

require('../Prototypes');
global._core = require('../Core');
global._logger = new _core.Logger();

global._cache = {
    User: new Cache('user', 'userid'),
    Guild: new Cache('guild', 'guildid'),
    Tag: new Cache('tag', 'name')
};

global._constants = _core.Constants;

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
        this.Helpers = require('./Helpers');

        this.LocaleManager = new LocaleManager();
        this.LocaleManager.init();

        this.CommandManager = new CommandManager();
        this.CommandManager.init();

        this.EventManager = new EventManager();
        this.EventManager.init();

        this.sender = new _core.Structures.Sender(process);

        this.emitter = new _dep.EventEmitter();

        this.database = new Database(this);

        this.awaitedMessages = {};
    }

    async decodeLocale(dest, key, args) {
        await this.Core.Helpers.Message.decode(dest, key, args);
    }

    async doEval(ctx, code) {
        const str = `var func = async function() {\n    ${code}\n}.bind(this)\nfunc`;
        const toExecute = eval(str);
        return await toExecute();
    }
}

var discord = new DiscordClient();
discord.sender.send('threadReady', process.env.SHARD_ID);

process.on('message', async msg => {
    const { data, code } = JSON.parse(msg);
    if (code.startsWith('await:')) {
        _discord.sender.emit(code, data);
        return;
    }
    switch (code) {
        case 'await':
            const eventKey = 'await:' + data.key;
            switch (data.message) {
                case 'connect':
                    await discord.connect();
                    discord.sender.send(eventKey, true);
                    break;
                case 'shardStatus':
                    let shards = discord.shards.map(s => {
                        return { id: s.id, status: s.status, guilds: discord.guilds.filter(g => g.shard.id == s.id).length };
                    });
                    discord.sender.send(eventKey, {
                        guilds: discord.guilds.size,
                        shards,
                        id: process.env.SHARD_ID
                    });
                    break;
            }
            break;
        default:
            discord.emitter.emit((code, { data, code }));
            break;
    }
});


module.exports = DiscordClient;
