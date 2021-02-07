const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class AvatarCommand extends BaseCommand {
    constructor() {
        super({
            name: 'avatar',
            category: newbutils.commandTypes.GENERAL,
            usage: 'avatar [id/name/mention]',
            info: 'Gets a user\'s avatar',
            flags: [{
                flag: 'f',
                word: 'format',
                desc: 'The file format. Can be \'jpg\', \'png\', \'webp\', or \'gif\'. Defaults to \'png\', or \'gif\' if it\'s an animated avatar.'
            },
            {
                flag: 's',
                word: 'size',
                desc: 'The file size. Can be 128, 256, 512, 1024, or 2048. Defaults to 512.'
            }]
        });
    }

    async execute(msg, words, text) {
        var user;
        let input = newbutils.parse.flags(this.flags, words);
        if (input.undefined.length == 0) {
            user = msg.author;
        } else {
            user = await bu.getUser(msg, input.undefined.join(' '));
        }
        if (!user) {
            return;
        }
        let format,
            size;
        if (input.f && input.f.length > 0) format = input.f.join(' ');
        if (input.s && input.s.length > 0) size = parseInt(input.s.join(' '));
        console.debug(format, size);
        await msg.channel.sendTyping();
        bu.sendFile(msg.channel.id, `**${bu.getFullName(user)}**'s avatar`, user.dynamicAvatarURL(format, size));
    }
}

module.exports = AvatarCommand;
