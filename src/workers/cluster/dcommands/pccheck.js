const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class PccheckCommand extends BaseCommand {
    constructor() {
        super({
            name: 'pccheck',
            category: newbutils.commandTypes.IMAGE,
            usage: 'pccheck <text>',
            info: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.'
        });
    }

    async execute(msg, words) {
        if (words.length === 1) {
            return bu.send(msg, 'You didn\'t provide any text!');
        }
        let text = words.slice(1).join(' ');
        bot.sendChannelTyping(msg.channel.id);
        text = await bu.filterMentions(text);

        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'pccheck',
            code: code,
            text
        });

        await bu.send(msg, undefined, {
            file: buffer,
            name: 'didyouknow.png'
        });
    }
}

module.exports = PccheckCommand;
