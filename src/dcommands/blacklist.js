const BaseCommand = require('../structures/BaseCommand');

class BlacklistCommand extends BaseCommand {
    constructor() {
        super({
            name: 'blacklist',
            category: bu.CommandType.ADMIN,
            usage: 'blacklist [channel]',
            info: 'Blacklists the current channel, or the channel(s) that you mention. The bot will not respond until you do `blacklist` again.'
        });
    }

    async execute(msg, words, text) {
        let channelIds = [];
        if (msg.channelMentions.length === 0) channelIds.push(msg.channel.id);
        else channelIds = msg.channelMentions;

        let storedGuild = await bu.getGuild(msg.guild.id);
        for (let channelId of channelIds) {
            let guildChannel = storedGuild.channels && storedGuild.channels.hasOwnProperty(channelId)
                ? storedGuild.channels[channelId]
                : { nsfw: false };

            const channel = await bu.getChannel(msg, channelId, { quiet: true });
            if (guildChannel.blacklisted) {
                guildChannel.blacklisted = false;
                bu.send(msg, `**${channel.name}** is no longer blacklisted.`);
            } else {
                guildChannel.blacklisted = true;
                bu.send(msg, `**${channel.name}** is now blacklisted.`);
            }

            storedGuild.channels[channelId] = guildChannel;
        }

        r.table('guild').get(msg.guild.id).update({
            channels: storedGuild.channels
        }).run();
    }
}

module.exports = BlacklistCommand;
