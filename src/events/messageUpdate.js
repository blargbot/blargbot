/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:18:57
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-26 12:38:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('messageUpdate', async function (msg, oldmsg) {
    if (oldmsg == undefined) {
        if (bot.channelGuildMap.hasOwnProperty(msg.channel.id)) {
            try {
                msg = await bot.getMessage(msg.channel.id, msg.id);
            } catch (err) {
                return; // Message wasn't found
            }
        } else return; // Don't handle DM
    }
    const storedGuild = await bu.getGuild(msg.guild.id);
    await bu.handleCensor(msg, storedGuild);

    if (msg.author) {
        if (!oldmsg) {

            let storedMsg = await bu.getChatlog(msg.id);
            if (storedMsg) {

                // console.debug('Somebody deleted an uncached message, but we found it in the DB.', storedMsg);
                oldmsg = {};
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
                oldmsg.channel = bot.getChannel(msg.channel.id);

            } else {
                console.debug('Somebody updated an uncached message and unstored message.');
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
        let oldMsg;
        if (storedGuild.settings.makelogs)
            oldMsg = oldmsg.content || 'No content to display. This is either due to the message only containing an attachment, or existing before makelogs was set to true';
        else
            oldMsg = 'uncached :(\nPlease enable chatlogging to use this functionality (`b!settings makelogs true`)';
        let newMsg = msg.content || '""';
        if (oldMsg.length + newMsg.length > 1900) {
            if (oldMsg.length > 900) oldMsg = oldMsg.substring(0, 900) + '... (too long to display)';
            if (newMsg.length > 900) newMsg = newMsg.substring(0, 900) + '... (too long to display)';
        }
        if (msg.guild) {
            await bu.logEvent(msg.guild.id, 'messageupdate', [{
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
    }
});
