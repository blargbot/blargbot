const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ThesearchCommand extends BaseCommand {
    constructor() {
        super({
            name: 'color',
            category: newbutils.commandTypes.IMAGE,
            usage: 'color [codes]...',
            info: 'Returns the provided colors'
        });
    }

    async execute(msg, words) {
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
