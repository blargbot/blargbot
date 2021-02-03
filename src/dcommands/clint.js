const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ClintCommand extends BaseCommand {
    constructor() {
        super({
            name: 'clint',
            category: newbutils.commandTypes.IMAGE,
            usage: 'clint [user]',
            info: 'I don\'t even know, to be honest.',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }]
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
        } else if (input.undefined.join('') !== '') {
            user = await bu.getUser(msg, input.undefined.join(' '));
            if (!user) return;
            url = user.avatarURL;
        }
        if (!url) url = msg.author.avatarURL;
        bot.sendChannelTyping(msg.channel.id);


        let code = bu.genEventCode();

        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'clint',
            image: url
        });

        await bu.send(msg, undefined, {
            file: buffer,
            name: 'clint.png'
        });
    }
}

module.exports = ClintCommand;
