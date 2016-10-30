var e = module.exports = {};





e.init = () => {
    
    

    e.category = bu.CommandType.COMMANDER;
};
e.isCommand = true;

e.hidden = false;
e.usage = 'blacklist';
e.info = 'Blacklists the current channel. The bot will not respond until you do `blacklist` again.';
e.longinfo = `<p>Blacklists the current channel. The bot will not respond until you do the command again.</p>`;

e.execute = async function(msg) {
    let storedGuild = await bu.r.table('guild').get(msg.channel.guild.id).run();
    let channel = storedGuild.channels && storedGuild.channels.hasOwnProperty(msg.channel.id)
        ? storedGuild.channels[msg.channel.id] : {
            nsfw: false
        };
    if (channel.blacklisted) {
        channel.blacklisted = false;
        bu.send(msg, 'This channel is no longer blacklisted.');
    } else {
        channel.blacklisted = true;
        bu.send(msg, 'This channel is now blacklisted.');

    }
    storedGuild.channels[msg.channel.id] = channel;
    bu.r.table('guild').get(msg.channel.guild.id).update({
        channels: storedGuild.channels
    }).run();
};