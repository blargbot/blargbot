const BaseCommand = require('../structures/BaseCommand');

class ChangelogCommand extends BaseCommand {
    constructor() {
        super({
            name: 'changelog',
            category: bu.CommandType.ADMIN,
            usage: 'changelog',
            info: 'Sets the current channel as your guild\'s changelog channel. A message will be posted in this channel whenever there is an update. The bot requires the `embed links` permission for this.'
        });
    }

    async execute(msg, words, text) {
        let channelid = msg.channel.id;
        if (msg.channelMentions.length > 0) channelid = msg.channelMentions[0];

        let changelogs = await r.table('vars').get('changelog');
        if (!changelogs) {
            await r.table('vars').insert({
                varname: 'changelog',
                guilds: {}
            });
            changelogs = {
                guilds: {}
            };
        }

        if (changelogs.guilds[msg.guild.id] == msg.channel.id) {
            changelogs.guilds[msg.guild.id] = undefined;
            await bu.send(msg, `You will no longer receive changelog notifications.`);
        } else {
            changelogs.guilds[msg.guild.id] = msg.channel.id;
            await bu.send(msg, `You will now receive changelog notifications in this channel.`);
        }

        await r.table('vars').get('changelog').replace(changelogs).run();
    }
}

module.exports = ChangelogCommand;
