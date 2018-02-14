process.on('unhandledRejection', (err, p) => {
  console.error('Unhandled Promise Rejection:', err.stack);
});

const { CommandManager, EventManager, LocaleManager, TagManager, TagVariableManager } = require('./Managers');
const { Cache } = require('./Structures');
const Database = require('./Database');
const Eris = require('eris');
const EventEmitter = require('eventemitter3');
const data = require('./Structures/Data');
const ArgumentLexer = require('./ArgumentLexer');
const core = require('./index.js');
const fs = require('fs'), path = require('path');

global.Promise = require('bluebird');
global._config = require('../config.json');
new core.Logger(parseInt(process.env.SHARD_ID), _config.log.level || 'info').setGlobal();

class DiscordClient extends Eris.Client {
  constructor() {
    console.debug('Max:', process.env.SHARD_MAX, 'ID:', process.env.SHARD_ID);
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

    this.localeDirty = false;

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

    this.TagVariableManager = new TagVariableManager(this);
    this.TagVariableManager.init();

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
      console.info('Database authenticated');
      this.cache = {
        User: new Cache(this, this.models.User, 'userId'),
        Guild: new Cache(this, this.models.Guild, 'guildId'),
        Tag: new Cache(this, this.models.Tag, 'name')
      };
    });

    this.awaitedMessages = {};
    this.awaitedReactions = {};

    this.TagLexer = new core.Tag.TagLexer();
    this.ArgumentLexer = new ArgumentLexer();

    this.catOverrides = true;

    if (this.localeDirty === true) {
      console.info('Some keys have been generated.');
      this.LocaleManager.save('en');
      //   fs.writeFileSync(path.join(__dirname, '..', 'Locale', 'en.json'), JSON.stringify(this.LocaleManager.localeList.en, null, 4));
    }
  }

  getData(type, ...args) {
    if (this.Data[type][args[0]])
      return this.Data[type][args[0]];
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
        case 'tagList':
          let tags = {};
          let map = discord.TagManager.tagMap;
          for (const key in map) {
            if (key !== '_') {
              let t = Object.values(map[key]).map(t => t.serialize());
              tags[key] = t;
            }
          }
          discord.sender.send(eventKey, tags);
          break;
        case 'commandList':
          let commands = {};
          let list = discord.CommandManager.commandList;
          for (const key in list) {
            let c = list[key];
            if (c.category !== 'cat') {
              if (!commands.hasOwnProperty(c.category))
                commands[c.category] = [];
              commands[c.category].push(c.serialize());
            }
          }
          discord.sender.send(eventKey, commands);
          break;
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
