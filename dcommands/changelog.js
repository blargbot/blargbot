var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.isCommand = true;
e.hidden = false;
e.usage = 'changelog';
e.info = 'Sets the current channel as your guild\'s changelog channel. A message will be posted in this channel whenever there is an update. The bot requires the `embed links` permission for this.';
e.longinfo = `<p>Sets the current channel as your guild\'s changelog channel. A message will be posted in this channel whenever there is an update. The bot requires the <code>embed links</code> permission for this.</p>`;

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