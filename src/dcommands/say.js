const BaseCommand = require('../structures/BaseCommand');

class SayCommand extends BaseCommand {
    constructor() {
        super({
            name: 'say',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            let channel = '';
            if (bot.channelGuildMap.hasOwnProperty(words[1])) {
                channel = words[1];
                bu.send(channel, words.slice(2).join(' '));
            } else {
                channel = msg.channel.id;
                bu.send(channel, words.slice(1).join(' '));
            }
        }
    }
}

module.exports = SayCommand;
