const irc = _dep.irc;

class IrcClient {
    constructor() {
        this.client = new irc.Client(_config.irc.server, _config.irc.nick, {
            channels: [_config.irc.channel],
            autoRejoin: true,
            userName: 'blargbot',
            realName: 'blargbot',
            stripColors: true
        });
    }

    registerListeners() {
        this.client.addListener('motd', function () {
            this.client.say('nickserv', `identify ${_config.irc.nickserv_name} ${_config.irc.nickserv_pass}`);
        });
    }
}

module.exports = IrcClient;