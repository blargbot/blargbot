const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: 'invite',
            aliases: ['join'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'invite',
            info: 'Gets you invite information.'
        });
    }

    async execute(msg) {
        bu.send(msg, 'Invite me to your guild!\n' +
            '<http://invite.blargbot.xyz/>\n' +
            'Don\'t need the moderation functions? Use this link instead:\n' +
            '<http://minvite.blargbot.xyz/>\n' +
            'Join my support guild!\nhttps://discord.gg/015GVxZxI8rtlJgXF');
    }
}

module.exports = InviteCommand;
