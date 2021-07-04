const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class SayCommand extends BaseCommand {
    constructor() {
        super({
            name: 'say',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words) {
        if (msg.author.id == config.discord.users.owner) {
            let channel = '';
            if (Object.prototype.hasOwnProperty.call(bot.channelGuildMap, words[1])) {
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
