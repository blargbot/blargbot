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
        try {
            let buffer = await bu.blargbotApi('color', {
                color: words.slice(1)
            });
            if (!buffer) {
                return await bu.send(msg, 'Whoops, one of the things you provided was not a color!');
            }
            await bu.send(msg, undefined, {
                file: buffer,
                name: 'color.png'
            });
        } catch (err) {
            await bu.send(msg, 'Whoops, something went wrong: `' + err.message + '`');
        }
    }
}

module.exports = ThesearchCommand;
