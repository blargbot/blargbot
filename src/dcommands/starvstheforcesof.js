const BaseCommand = require('../structures/BaseCommand');

class StarvstheforcesofCommand extends BaseCommand {
    constructor() {
        super({
            name: 'starvstheforcesof',
            aliases: ['svtfo'],
            category: bu.CommandType.IMAGE,
            usage: 'starvstheforcesof [user]',
            info: 'WHO IS STAR BATTLING THIS EPISODE?',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
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
            command: 'starvstheforcesof',
            code: code,
            avatar: url
        });

        await bu.send(msg, undefined, {
            file: buffer,
            name: 'starvstheforcesof.png'
        });
    }
}

module.exports = StarvstheforcesofCommand;
