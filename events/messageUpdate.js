bot.on('messageUpdate', async function (msg, oldmsg) {
    if (msg.channel.guild == undefined) {
        if (bot.channelGuildMap.hasOwnProperty(msg.channel.id)) {
            msg.channel.guild = bot.guilds.get(bot.channelGuildMap[msg.channel.id]);
            msg.guild = msg.channel.guild;
        } else return; // Don't handle DM
    }
    if (msg.author) {
        const storedGuild = await bu.getGuild(msg.guild.id);
        if (!oldmsg) {
            let storedMsg = await r.table('chatlogs')
                .getAll(msg.id, {
                    index: 'msgid'
                })
                .orderBy(r.desc('msgtime')).run();
            if (storedMsg.length > 0) {

                // logger.debug('Somebody deleted an uncached message, but we found it in the DB.', storedMsg);
                oldmsg = {};
                storedMsg = storedMsg[0];
                oldmsg.content = storedMsg.content;
                oldmsg.author = bot.users.get(storedMsg.userid) || {
                    id: storedMsg.userid
                };
                oldmsg.mentions = storedMsg.mentions ? storedMsg.mentions.split(',').map(m => {
                    return {
                        username: m
                    };
                }) : [];
                oldmsg.attachments = [];
                if (storedMsg.attachment) oldmsg.attachments = [{
                    url: storedMsg.attachment
                }];
                oldmsg.channel = bot.getChannel(msg.channelID);

            } else {
                logger.debug('Somebody deleted an uncached message and unstored message.');
                return;
            }
        }
        if (msg.content == oldmsg.content) {
            return;
        }
        if (storedGuild.settings.makelogs)
            if (msg.channel.id != '204404225914961920') {
                var nsfw = await bu.isNsfwChannel(msg.channel.id);
                if (msg.author)
                    bu.insertChatlog(msg, 1);
            }
        let oldMsg = oldmsg.content || 'uncached :(';
        let newMsg = msg.content || '""';
        if (oldMsg.length + newMsg.length > 1900) {
            if (oldMsg.length > 900) oldMsg = oldMsg.substring(0, 900) + '... (too long to display)';
            if (newMsg.length > 900) newMsg = newMsg.substring(0, 900) + '... (too long to display)';
        }
        if (msg.guild)
            bu.logEvent(msg.guild.id, 'messageupdate', [{
                name: 'User',
                value: msg.author ? bu.getFullName(msg.author) + ` (${msg.author.id})` : 'Undefined',
                inline: true
            }, {
                name: 'Message ID',
                value: msg.id,
                inline: true
            }, {
                name: 'Channel',
                value: msg.channel.mention,
                inline: true
            }, {
                name: 'Old Message',
                value: oldMsg
            }, {
                name: 'New Message',
                value: newMsg
            }]);
    }
});