process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Promise Rejection:', reason || p);
});

const { CommandManager, EventManager, LocaleManager, TagManager } = require('./Managers');
const { Cache } = require('./Structures');
const Database = require('./Database');
const Eris = require('eris');
const EventEmitter = require('eventemitter3');
const data = require('./Structures/Data');
const core = require('./index.js');

global.Promise = require('bluebird');
global._config = require('../config.json');
global._logger = new core.Logger();

class DiscordClient extends Eris.Client {
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

        require('../Prototypes')(this);

        this.Core = core;
        this.Constants = core.Constants;
        this.Helpers = {};
        const helpers = require('./Helpers');
        for (const key of Object.keys(helpers)) {
            const helper = new helpers[key](this);
            this.Helpers[key] = helper;
        }
        this.LocaleManager = new LocaleManager(this);
        this.LocaleManager.init();

        this.CommandManager = new CommandManager(this);
        this.CommandManager.init();

        this.TagManager = new TagManager(this);
        this.TagManager.init();

        this.EventManager = new EventManager(this);
        this.EventManager.init();

        this.Data = {
            CustomCommand: {},
            Tag: {},
            Guild: {},
            User: {}
        };

        this.sender = new core.Structures.Sender(this, process);

        this.emitter = new EventEmitter();

        this.database = new Database(this);
        this.database.authenticate().then(() => {
            this.cache = {
                User: new Cache(this, this.models.User, 'userId'),
                Guild: new Cache(this, this.models.Guild, 'guildId'),
                Tag: new Cache(this, this.models.Tag, 'name')
            };
        });

        this.awaitedMessages = {};

        this.TagLexer = new core.TagLexer();
    }

    getData(type, ...args) {
        let constr;
        switch (type) {
            case this.Constants.Types.Data.CUSTOM_COMMAND: constr = data.DataCustomCommand; break;
            case this.Constants.Types.Data.USER: constr = data.DataUser; break;
            case this.Constants.Types.Data.GUILD: constr = data.DataGuild; break;
            case this.Constants.Types.Data.TAG: constr = data.DataTag; break;
        }
        if (constr) {
            return new constr(this, ...args);
        }
    }

    getDataGuild(id) {
        return this.getData(this.Constants.Types.Data.GUILD, id);
    }

    getDataUser(id) {
        return this.getData(this.Constants.Types.Data.USER, id);
    }

    getDataTag(id) {
        return this.getData(this.Constants.Types.Data.TAG, id);
    }

    getDataCustomCommand(id, guildId) {
        return this.getData(this.Constants.Types.Data.CUSTOM_COMMAND, id, guildId);
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
        discord.sender.emit(code, data);
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
