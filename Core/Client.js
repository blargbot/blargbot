const Spawner = require('./Spawner');
const EventEmitter = require('eventemitter3');
const Eris = require('eris');
const Website = require('../Frontend/Website');

class Client {
    constructor() {
        this.Emitter = new EventEmitter();
        //this.discord = new DiscordClient();
        this.spawner = new Spawner(this, {
            max: _config.discord.shards
        });
        //this.irc = new IrcClient();
        this.Helpers = require('./Helpers');

        // A discord client that *doesn't* connect to the gateway
        this.discord = new Eris(_config.discord.token, {
            restMode: true
        });

        this.website = new Website();
    }

    async init() {
        await this.spawner.spawnAll();
        console.init('All shards have spawned. Connecting...');
        await this.spawner.awaitBroadcast('connect');
        console.init('Shards connected');

        this.website.start();
    }
}

module.exports = Client;