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

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let shitText = 'Your favourite anime';
        var plural = false;
        if (input.p) plural = true;
        if (input.undefined.length > 0)
            shitText = await bu.filterMentions(input.undefined.join(' '));
        bot.sendChannelTyping(msg.channel.id);
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'shit',
            code: code,
            text: shitText,
            plural: plural
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'SHIIIITTTTTT.png'
        });
    }
}

module.exports = ShitCommand;
