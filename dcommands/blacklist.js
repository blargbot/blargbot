var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.COMMANDER;
};

e.isCommand = true;
e.hidden = false;
e.usage = 'blacklist [channel]';
e.info = 'Blacklists the current channel, or the first channel that you mention. The bot will not respond until you do `blacklist` again.';
e.longinfo = `<p>Blacklists the current channel. The bot will not respond until you do the command again.</p>`;

e.execute = async function(msg) {
    let channelid = msg.channel.id;
    if (msg.channelMentions.length > 0) channelid = msg.channelMentions[0];

    let storedGuild = await bu.getGuild(msg.guild.id);
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
    r.table('guild').get(msg.guild.id).update({
        channels: storedGuild.channels
    }).run();
};