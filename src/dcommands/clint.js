const BaseCommand = require('../structures/BaseCommand');

class ClintCommand extends BaseCommand {
    constructor() {
        super({
            name: 'clint',
            category: bu.CommandType.IMAGE,
            usage: 'clint [user]',
            info: 'I don\'t even know, to be honest.',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let user = msg.author;
        let url;
        if (msg.attachments.length > 0) {
            url = msg.attachments[0].url;
        } else if (input.I) {
            url = input.I.join(' ');
        } else if (input.undefined.join('') !== '') {
            user = await bu.getUser(msg, input.undefined.join(' '));
            if (!user) return;
            url = user.avatarURL;
        }
        if (!url) url = msg.author.avatarURL;
        bot.sendChannelTyping(msg.channel.id);

        let buf = await bu.blargbotApi('clint', { image: url });

        await bu.send(msg, undefined, {
            file: buf,
            name: 'clint.png'
        });
    }
}

module.exports = ClintCommand;
