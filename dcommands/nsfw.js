var e = module.exports = {};





e.init = () => {
    
    
    e.category = bu.CommandType.COMMANDER;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'nsfw';
e.info = 'Designates the current channel as NSFW, allowing you to use NSFW commands.';
e.longinfo = '<p>Designates the current channel as NSFW, allowing you to use NSFW commands.</p>';


e.execute = async function(msg) {
    let storedGuild = await bu.r.table('guild').get(msg.channel.guild.id).run();
    let channel = storedGuild.channels && storedGuild.channels.hasOwnProperty(msg.channel.id)
        ? storedGuild.channels[msg.channel.id] : {
            blacklisted: false
        };
    if (channel.nsfw) {
        channel.nsfw = false;
        bu.send(msg.channel.id, 'This channel is no longer NSFW.');
    } else {
        channel.nsfw = true;
        bu.send(msg.channel.id, 'This channel is now NSFW.');
    }
    storedGuild.channels[msg.channel.id] = channel;
    bu.r.table('guild').get(msg.channel.guild.id).update({
        channels: storedGuild.channels
    }).run();
};