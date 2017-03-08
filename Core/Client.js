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
    }

    async init() {
        this.spawner.spawnAll();        
        await this.spawner.awaitBroadcast('construct');
        console.log('Shards constructed');
        await this.spawner.awaitBroadcast('connect');
        console.log('Shards connected');
    }
}

module.exports = Client;