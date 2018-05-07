const BaseCommand = require('../structures/BaseCommand');

class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: 'invite',
            category: bu.CommandType.GENERAL,
            usage: 'invite',
            info: 'Gets you invite information.'
        });
    }

    async execute(msg, words, text) {
        bu.send(msg, 'Invite me to your guild!\n' +
            '<http://invite.blargbot.xyz/>\n' +
            'Don\'t need the moderation functions? Use this link instead:\n' +
            '<http://minvite.blargbot.xyz/>\n' +
            'Join my support guild!\nhttps://discord.gg/015GVxZxI8rtlJgXF');
    }
}

module.exports = InviteCommand;
