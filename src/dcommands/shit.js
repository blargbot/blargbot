const BaseCommand = require('../structures/BaseCommand');

class ShitCommand extends BaseCommand {
    constructor() {
        super({
            name: 'shit',
            aliases: ['heck'],
            category: bu.CommandType.IMAGE,
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
        let input = bu.parseInput(this.flags, words);
        let text = 'Your favourite anime';
        let plural = false;
        if (input.p) plural = true;
        if (input.undefined.length > 0)
            text = await bu.filterMentions(input.undefined.join(' '));
        bot.sendChannelTyping(msg.channel.id);
        let buf = await bu.blargbotApi('shit', { text, plural });
        bu.send(msg, undefined, {
            file: buf,
            name: 'SHIIIITTTTTT.png'
        });
    }
}

module.exports = ShitCommand;
