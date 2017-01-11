var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.isCommand = true;
e.hidden = false;
e.usage = 'blacklist [channel]';
e.info = 'Blacklists the current channel, or the first channel that you mention. The bot will not respond until you do `blacklist` again.';
e.longinfo = `<p>Blacklists the current channel. The bot will not respond until you do the command again.</p>`;

e.execute = async function(msg) {
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
};