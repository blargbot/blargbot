const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ClippyCommand extends BaseCommand {
    constructor() {
        super({
            name: 'clippy',
            aliases: ['clippit', 'paperclip'],
            category: newbutils.commandTypes.IMAGE,
            usage: 'clippy <text>',
            info: 'Clippy the paperclip is here to save the day!',
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words) {
        if (words.length == 1) {
            bu.send(msg, 'Not enough arguments!');
            return;
        }
        let text = await bu.filterMentions(words.slice(1).join(' '));
        bot.sendChannelTyping(msg.channel.id);
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'clippy',
            code: code,
            text
        });
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'DOYOUNEEDHELP.png'
        });
    }
}

module.exports = ClippyCommand;
