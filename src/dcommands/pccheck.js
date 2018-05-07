const BaseCommand = require('../structures/BaseCommand');

class PccheckCommand extends BaseCommand {
    constructor() {
        super({
            name: 'pccheck',
            category: bu.CommandType.IMAGE,
            usage: 'pccheck <text>',
            info: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.'
        });
    }

    async execute(msg, words, text) {
        if (words.length === 1) {
            return bu.send(msg, 'You didn\'t provide any text!');
        }

        bot.sendChannelTyping(msg.channel.id);

        let code = bu.genEventCode();

        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'pccheck',
            code: code,
            text: words.slice(1).join(' ')
        });

        bu.send(msg, undefined, {
            file: buffer,
            name: 'didyouknow.png'
        });
    }
}

module.exports = PccheckCommand;
