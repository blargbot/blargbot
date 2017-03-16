const Spawner = require('./Spawner');

class Client {
    constructor() {
        this.Emitter = new _dep.EventEmitter();
        //this.discord = new DiscordClient();
        this.spawner = new Spawner({
            max: 2
        });
        //this.irc = new IrcClient();
        this.Helpers = require('./Helpers');

        // A discord client that *doesn't* connect to the gateway
        this.discord = new _dep.Eris(_config.discord.token);
    }

    async init() {
        await this.spawner.spawnAll();
        _logger.init('All shards have spawned. Connecting...');
        await this.spawner.awaitBroadcast('connect');
        _logger.init('Shards connected');
    }
}

module.exports = Client;