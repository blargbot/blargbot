const BaseCommand = require('../structures/BaseCommand');

class DeletemsgCommand extends BaseCommand {
    constructor() {
        super({
            name: 'deletemsg',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            let channel = '';
            let messages = [];
            if (bot.channelGuildMap.hasOwnProperty(words[1])) {
                channel = words[1];
                messages = words.slice(2);
            } else {
                channel = msg.channel.id;
                messages = words.slice(1);
            }
            if (msg.channel.guild.members.get(bot.user.id).permissions.json.manageMessages) {
                bot.deleteMessages(channel, messages);
            } else {
                messages.forEach(m => {
                    bot.deleteMessage(channel, m);
                });
            }
        }
    }
}

module.exports = DeletemsgCommand;
