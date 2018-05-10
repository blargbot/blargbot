const BaseCommand = require('../structures/BaseCommand');

class DeleteCommand extends BaseCommand {
    constructor() {
        super({
            name: 'delete',
            category: bu.CommandType.IMAGE,
            usage: 'delete [text]',
            info: 'Shows that you\'re about to delete something.'
        });
    }

    async execute(msg, words) {
        if (words.length > 1) {
            let text = (await bu.filterMentions(words.slice(1).join('\n').replace(/\n/gim, ' ').substring(0, 256), msg.guild)).trim();
            let code = bu.genEventCode();
            bot.sendChannelTyping(msg.channel.id);
            let buf = await bu.blargbotApi('delete', { text });
            bu.send(msg, undefined, {
                file: buf,
                name: 'deleted.png'
            });
        } else {
            await bu.send(msg, 'Not enough input!');
        }
    }
}

module.exports = DeleteCommand;
