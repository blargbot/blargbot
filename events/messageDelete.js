async function handleDelete(msg, quiet) {
    //   logger.debug('A message was deleted in ' + msg.)
    if (msg.channel.guild == undefined) return;
    const storedGuild = await bu.getGuild(msg.channel.guild.id);
    if (!msg.author || !msg.channel) {
        let storedMsg = await r.table('chatlogs')
            .getAll(msg.id, {
                index: 'msgid'
            })
            .orderBy(r.desc('msgtime')).run();
        if (storedMsg.length > 0) {

            logger.debug('Somebody deleted an uncached message, but we found it in the DB.');

            storedMsg = storedMsg[0];
            msg.content = storedMsg.content;
            msg.author = bot.users.get(storedMsg.userid) || {
                id: storedMsg.userid
            };
            if (storedMsg.mentions)
                msg.mentions = storedMsg.mentions.split(',').map(m => {
                    return {
                        username: m
                    };
                });
            msg.attachments = [];
            if (storedMsg.attachment) msg.attachments = [{
                url: storedMsg.attachment
            }];
            //   msg.channel = bot.getChannel(msg.channelID);

        } else {
            logger.debug('Somebody deleted an uncached message and unstored message.');
            //       msg.channel = bot.getChannel(msg.channelID);
            msg.author = {};
            msg.mentions = [];
            msg.attachments = [];
        }
    }
    if (bu.commandMessages[msg.channel.guild.id] && bu.commandMessages[msg.channel.guild.id].indexOf(msg.id) > -1) {
        let val = await bu.guildSettings.get(msg.channel.guild.id, 'deletenotif');
        if (val && val != 0)
            bu.send(msg, `**${msg.member.nick
|| msg.author.username}** deleted their command message.`);
        bu.commandMessages[msg.channel.guild.id].splice(bu.commandMessages[msg.channel.guild.id].indexOf(msg.id), 1);
    }
    if (storedGuild.settings.makelogs)
        if (msg.channel.id != '204404225914961920') {
            try {
                await r.table('chatlogs').insert({
                    id: bu.makeSnowflake(),
                    content: msg.content,
                    attachment: msg.attachments && msg.attachments[0] ? msg.attachments[0].url : undefined,
                    userid: msg.author.id,
                    msgid: msg.id,
                    channelid: msg.channel.id,
                    guildid: msg.channel.guild.id,
                    msgtime: r.epochTime(dep.moment() / 1000),
                    type: 2
                }).run();
            } catch (err) {
                logger.error(err);
            }
        }
    let newMsg = msg.content || 'uncached :(';
    if (newMsg.length > 1900) newMsg = newMsg.substring(0, 1900) + '... (too long to display)';
    if (!quiet)
        bu.logEvent(msg.channel.guild.id, 'messagedelete', [{
            name: 'User',
            value: bu.getFullName(msg.author) + ` (${msg.author.id})`,
            inline: true
        }, {
            name: 'Message ID',
            value: msg.id,
            inline: true
        }, {
            name: 'Channel',
            value: msg.channel ? msg.channel.mention : 'Uncached',
            inline: true
        }, {
            name: 'Content',
            value: newMsg
        }]);
}

bot.on('messageDelete', handleDelete);

bot.on('messageDeleteBulk', function(msgs) {
    for (const msg of msgs) {
        handleDelete(msg, true);
    }
    bu.logEvent(msgs[0].channel.guild.id, 'messagedelete', [{
        name: 'Count',
        value: msgs.length,
        inline: true
    }, {
        name: 'Channel',
        value: msgs[0].channel.mention,
        inline: true
    }], {
        description: 'Bulk Message Delete'
    });
});