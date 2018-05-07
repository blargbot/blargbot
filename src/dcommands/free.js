const BaseCommand = require('../structures/BaseCommand');

class FreeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'free',
            category: bu.CommandType.IMAGE,
            usage: 'free <caption> [flags]',
            info: 'Tells everyone what you got for free',
            flags: [{ flag: 'b', word: 'bottom', desc: 'The bottom caption.' }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, `Usage: \`${e.usage}\``);
            return;
        }
        bot.sendChannelTyping(msg.channel.id);

        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'free',
            top: input.undefined.join(' '),
            bottom: input.b ? input.b.join(' ') : undefined
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'FREEFREEFREE.gif'
        });
    }
}

module.exports = FreeCommand;
