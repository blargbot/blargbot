const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class TriggeredCommand extends BaseCommand {
    constructor() {
        super({
            name: 'triggered',
            category: newbutils.commandTypes.IMAGE,
            usage: 'triggered [user]',
            info: 'Shows everyone how triggered you are.',
            flags: [
                { flag: 'i', word: 'invert', desc: 'Inverts the image.' },
                {
                    flag: 'h',
                    word: 'horizontal',
                    desc: 'Flips the image horizontally.'
                },
                {
                    flag: 'v',
                    word: 'vertical',
                    desc: 'Flips the image vertically.'
                },
                { flag: 's', word: 'sepia', desc: 'Applies a sepia filter.' },
                { flag: 'b', word: 'blur', desc: 'Applies a blur.' },
                {
                    flag: 'g',
                    word: 'greyscale',
                    desc: 'Makes the image greyscale'
                },
                { flag: 'I', word: 'image', desc: 'A custom image.' }
            ],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words) {
        let input = newbutils.parse.flags(this.flags, words);
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
        await bot.sendChannelTyping(msg.channel.id);
        let inverted = input.i != undefined;
        let horizontal = input.h != undefined;
        let vertical = input.v != undefined;
        let sepia = input.s != undefined;
        let blur = input.b != undefined;
        let greyscale = input.g != undefined;

        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'triggered',
            code: code,
            avatar: url,
            inverted,
            horizontal,
            vertical,
            sepia,
            blur,
            greyscale
        });
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'triggered.gif'
        });
    }
}

module.exports = TriggeredCommand;
