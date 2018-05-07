const BaseCommand = require('../structures/BaseCommand');

class DistortCommand extends BaseCommand {
    constructor() {
        super({
            name: 'distort',
            category: bu.CommandType.IMAGE,
            usage: 'distort [user]',
            info: 'Turns an avatar into modern art.',
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
        } else if (input.undefined.length > 0) {
            user = await bu.getUser(msg, input.undefined.join(' '));
            if (!user) return;
            url = user.avatarURL;
        }
        if (!url) url = msg.author.avatarURL;
        bot.sendChannelTyping(msg.channel.id);

        let code = bu.genEventCode();

        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'distort',
            code: code,
            avatar: url
        });

        bu.send(msg, undefined, {
            file: buffer,
            name: 'distorted.png'
        });
    }
}

module.exports = DistortCommand;
