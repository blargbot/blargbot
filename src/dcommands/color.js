const BaseCommand = require('../structures/BaseCommand');

class ThesearchCommand extends BaseCommand {
    constructor() {
        super({
            name: 'color',
            category: bu.CommandType.IMAGE,
            usage: 'color [codes]...',
            info: 'Returns the provided colors'
        });
    }

    async execute(msg, words) {
        var text = 'I use betterdiscord';
        if (words[1]) text = words.slice(1).join(' ');
        text = await bu.filterMentions(text);
        bot.sendChannelTyping(msg.channel.id);
        let buffer = await bu.blargbotApi('color', {
            color: words.slice(1)
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'color.png'
        });
    }
}

module.exports = ThesearchCommand;
