const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class FreeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'free',
            category: newbutils.commandTypes.IMAGE,
            usage: 'free <caption> [flags]',
            info: 'Tells everyone what you got for free',
            flags: [{ flag: 'b', word: 'bottom', desc: 'The bottom caption.' }],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words, text) {
        let input = newbutils.parse.flags(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, `Usage: \`${this.usage}\``);
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
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'FREEFREEFREE.gif'
        });
    }
}

module.exports = FreeCommand;
