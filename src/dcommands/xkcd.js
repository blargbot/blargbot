const BaseCommand = require('../structures/BaseCommand');

var xkcdMax = 0;

class XkcdCommand extends BaseCommand {
    constructor() {
        super({
            name: 'xkcd',
            category: bu.CommandType.IMAGE,
            usage: 'xkcd [number]',
            info: 'Gets an xkcd comic. If a number is not specified, gets a random one.'
        });
    }

    async execute(msg, words, text) {
        getXkcd(msg.channel.id, words);
    }
}

module.exports = XkcdCommand;
