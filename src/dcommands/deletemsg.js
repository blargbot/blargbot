const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class DeletemsgCommand extends BaseCommand {
    constructor() {
        super({
            name: 'deletemsg',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == config.discord.users.owner) {
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
