const BaseCommand = require('../structures/BaseCommand');

class ColorCommand extends BaseCommand {
    constructor() {
        super({
            name: 'color',
            category: bu.CommandType.IMAGE,
            usage: 'color [codes]...',
            info: 'Returns the provided colors as a PNG file.\n\nYou cannot provide more than 64 entries.\nHex codes must start with an #.'
        });
    }

    async execute(msg, words) {
        bot.sendChannelTyping(msg.channel.id);
        try {
            const colors = words.slice(1);
            if (colors.length == 0) return await bu.send(msg, 'Whoops, you did not provide any color!');
            if (colors.length > 64) return await bu.send(msg, 'Whoops, you provided too many colors!');
            let buffer = await bu.blargbotApi('color', {
                color: colors
            });
            if (!buffer) {
                return await bu.send(msg, 'Whoops, one of the things you provided was not a color!');
            }
            bu.send(msg, undefined, {
                file: buffer,
                name: 'color.png'
            });
        } catch (err) {
            bu.send(msg, 'Whoops, something went wrong: `' + err.message + '`');
        }
    }
}

module.exports = ColorCommand;
