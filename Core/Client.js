const DiscordClient = require('./DiscordClient');
const IrcClient = require('./IrcClient');

class Client {
    constructor() {
        this.Emitter = new _dep.EventEmitter();
        this.discord = new DiscordClient();
        //this.irc = new IrcClient();
        this.Helpers = require('./Helpers');

        this.discord.connect();
    }
}

module.exports = Client;