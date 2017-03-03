const {
    DiscordClient,
    IrcClient
} = require('../Core');

class Client {
    constructor() {
        this.Emitter = new _dep.EventEmitter();
        this.discord = new DiscordClient();
        this.irc = new IrcClient();
        this.Helpers = require('./Helpers');
    }
}