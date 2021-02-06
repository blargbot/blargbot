const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ArtCommand extends BaseCommand {
    constructor() {
        super({
            name: 'art',
            category: newbutils.commandTypes.IMAGE,
            usage: 'art [user]',
            info: 'Shows everyone a work of art.',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words, text) {
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
        bot.sendChannelTyping(msg.channel.id);

        let code = bu.genEventCode();

        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'art',
            code: code,
            avatar: url
        });

        await bu.send(msg, undefined, {
            file: buffer,
            name: 'sobeautifulstan.png'
        });
    }
}

module.exports = ArtCommand;
