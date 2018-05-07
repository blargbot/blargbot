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
        let channelids = [];
        if (msg.channelMentions.length === 0) channelids.push(msg.channel.id);
        else channelids = msg.channelMentions;

        let storedGuild = await bu.getGuild(msg.guild.id);
        for (let channelid of channelids) {
            let channel = storedGuild.channels && storedGuild.channels.hasOwnProperty(channelid) ?
                storedGuild.channels[channelid] : {
                    nsfw: false
                };

            if (channel.blacklisted) {
                channel.blacklisted = false;
                bu.send(msg, '**' + bot.getChannel(channelid).name + '** is no longer blacklisted.');
            } else {
                channel.blacklisted = true;
                bu.send(msg, '**' + bot.getChannel(channelid).name + '** is now blacklisted.');
            }

            storedGuild.channels[channelid] = channel;
        }
        r.table('guild').get(msg.guild.id).update({
            channels: storedGuild.channels
        }).run();
    }
}

module.exports = BlacklistCommand;
