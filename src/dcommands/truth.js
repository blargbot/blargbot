const BaseCommand = require('../structures/BaseCommand');

class TruthCommand extends BaseCommand {
    constructor() {
        super({
            name: 'truth',
            aliases: ['scrolloftruth'],
            category: bu.CommandType.IMAGE,
            usage: 'truth <text>',
            info: 'Shows everyone what is written in the Scroll of Truth.'
        });
    }

    async execute(msg, words) {
        if (words.length == 1) {
            bu.send(msg, 'Not enough arguments!'); return;
        }
        let text = await bu.filterMentions(words.slice(1).join(' '));
        bot.sendChannelTyping(msg.channel.id);
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'truth',
            code: code,
            text
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'ScrollOfTruth.png'
        });
    }
}

module.exports = TruthCommand;
