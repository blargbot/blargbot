const BaseCommand = require('../structures/BaseCommand');

class SonicsaysCommand extends BaseCommand {
    constructor() {
        super({
            name: 'sonicsays',
            category: bu.CommandType.IMAGE,
            usage: 'sonicsays <text>',
            info: 'Sonic wants to share some words of wisdom.',
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words) {
        if (words.length === 1) {
            return bu.send(msg, 'You didn\'t provide any text!');
        }

        let text = words.slice(1).join(' ');
        bot.sendChannelTyping(msg.channel.id);
        text = await bu.filterMentions(text);
        let buf = await bu.blargbotApi('sonicsays', { text });

        await bu.send(msg, undefined, {
            file: buf,
            name: 'sonicsays.png'
        });
    }
}

module.exports = SonicsaysCommand;
