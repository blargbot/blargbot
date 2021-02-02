const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ShitCommand extends BaseCommand {
    constructor() {
        super({
            name: 'shit',
            aliases: ['heck'],
            category: newbutils.commandTypes.IMAGE,
            usage: 'shit <text> [flags]',
            info: 'Tells everyone what\'s shit.',
            flags: [{
                flag: 'p',
                word: 'plural',
                desc: 'Whether or not the text is plural (use ARE instead of IS).'
            }]
        });
    }

    async execute(msg, words) {
        let input = newbutils.parse.flags(this.flags, words);
        let text = 'Your favourite anime';
        let plural = false;
        if (input.p) plural = true;
        if (input.undefined.length > 0)
            text = await bu.filterMentions(input.undefined.join(' '));
        bot.sendChannelTyping(msg.channel.id);
        let buf = await bu.blargbotApi('shit', { text, plural });
        await bu.send(msg, undefined, {
            file: buf,
            name: 'SHIIIITTTTTT.png'
        });
    }
}

module.exports = ShitCommand;
