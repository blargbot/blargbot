const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class RetardedCommand extends BaseCommand {
    constructor() {
        super({
            name: 'retarded',
            category: newbutils.commandTypes.IMAGE,
            usage: 'retarded <text> [flags]',
            info: 'Tells everyone who is retarded.',
            flags: [
                { flag: 'u', word: 'user', desc: 'The person who is retarded.' },
                { flag: 'I', word: 'image', desc: 'A custom image.' }
            ],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words) {
        let input = newbutils.parse.flags(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, 'Not enough input!');
            return;
        }
        let user;
        let url;
        if (msg.attachments.length > 0) {
            url = msg.attachments[0].url;
        } else if (input.I) {
            url = input.I.join(' ');
        } else if (input.u) {
            user = await bu.getUser(msg, input.u.join(' '));
            if (user) url = user.avatarURL;
        } else {
            url = msg.author.avatarURL;
        }

        let quote = await bu.filterMentions(input.undefined.join(' '));

        bot.sendChannelTyping(msg.channel.id);
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'retarded',
            code: code,
            text: quote,
            avatar: url
        });
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'retarded.png'
        });
    }
}

module.exports = RetardedCommand;
