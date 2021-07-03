const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class PixelateCommand extends BaseCommand {
    constructor() {
        super({
            name: 'pixelate',
            category: newbutils.commandTypes.IMAGE,
            usage: 'pixelate [url] [flags]',
            info: 'Pixelates an image. If url isn\'t provided, you must give an attachment.',
            flags: [{
                flag: 'u',
                word: 'user',
                desc: 'A user avatar instead of a url'
            },
            {
                flag: 's',
                word: 'scale',
                desc: 'The amount to pixelate by (defaults to 64)'
            }],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words, text) {
        let input = newbutils.parse.flags(this.flags, words);

        bot.sendChannelTyping(msg.channel.id);
        let url;
        let scale = input.s ? parseInt(input.s[0]) : 64;
        if (isNaN(scale)) scale = 64;
        if (input.u) {
            let user = await bu.getUser(msg, input.u.join(' '));
            if (!user) return;
            url = user.avatarURL;
        } else if (msg.attachments.length > 0) url = msg.attachments[0].url;
        else if (input.undefined.length > 0) url = input.undefined.join(' ');
        else {
            bu.send(msg, 'You must provide an image, either via url, attachment, or the user flag!');
            return;
        }
        if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(url)) {
            url = url.match(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/)[0];
        } else {
            bu.send(msg, 'That\'s not a valid url!');
            return;
        }
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'pixelate',
            code: code,
            input: input,
            url,
            scale
        });
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'pixld.png'
        });
    }
}

module.exports = PixelateCommand;
