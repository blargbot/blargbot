const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class DeleteCommand extends BaseCommand {
    constructor() {
        super({
            name: 'delete',
            category: newbutils.commandTypes.IMAGE,
            usage: 'delete [text]',
            info: 'Shows that you\'re about to delete something.'
        });
    }

    async execute(msg, words) {
        if (words.length > 1) {
            let text = (await bu.filterMentions(words.slice(1).join('\n').replace(/\n/gim, ' ').substring(0, 256), msg.guild)).trim();
            bot.sendChannelTyping(msg.channel.id);

            let code = bu.genEventCode();
            let buffer = await bu.awaitEvent({
                cmd: 'img',
                command: 'delete',
                code: code,
                text
            });

            await bu.send(msg, undefined, {
                file: buffer,
                name: 'deleted.png'
            });
        } else {
            await bu.send(msg, 'Not enough input!');
        }
    }
}

module.exports = DeleteCommand;
