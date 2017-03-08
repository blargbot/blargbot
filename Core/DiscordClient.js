const { CommandManager, EventManager } = require('./Managers/index.js');

global.Promise = require('bluebird');
global._dep = require('../Dependencies');
global._core = require('../Core');
global._config = require('../config.json');
global._constants = _core.Constants;
global._logger = new _core.Logger();

class DiscordClient extends _dep.Eris.Client {
    constructor() {
        super(process.env.SHARD_TOKEN, {
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
    }
}

process.on('message', msg => {
    const message = JSON.parse(msg);
    switch (message.code) {
        case 'await':
            const eventKey = 'await:' + message.data.key;
            switch (message.data.message) {
                case 'construct':
                    const discord = new DiscordClient();
                    discord.sender.send(eventKey, true);
                    break;
                case 'connect':
                    _discord.connect();
                    _discord.sender.send(eventKey, true);
                    break;
            }
            break;
    }
});

module.exports = DiscordClient;
