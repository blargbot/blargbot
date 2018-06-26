/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:22:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-26 12:30:27
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

async function handleDelete(msg, quiet) {
    if (msg.channel.guild == undefined) {
        if (bot.channelGuildMap.hasOwnProperty(msg.channel.id)) {
            msg.channel.guild = bot.guilds.get(bot.channelGuildMap[msg.channel.id]);
            msg.guild = msg.channel.guild;
        } else return; // Don't handle DM
    }
    const storedGuild = await bu.getGuild(msg.channel.guild.id);
    if (!msg.author || !msg.channel) {
        let storedMsg = await bu.getChatlog(msg.id);
        if (storedMsg) {

            console.debug('Somebody deleted an uncached message, but we found it in the DB.');

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
            console.debug('Somebody deleted an uncached message and unstored message.');
            //       msg.channel = bot.getChannel(msg.channelID);
            msg.author = {};
            msg.mentions = [];
            msg.attachments = [];
        }
    }
    if (bu.commandMessages[msg.channel.guild.id] && bu.commandMessages[msg.channel.guild.id].indexOf(msg.id) > -1) {
        let val = await bu.guildSettings.get(msg.channel.guild.id, 'deletenotif');
        if (val && val != 0 && (!bu.notCommandMessages || !bu.notCommandMessages[msg.channel.guild.id] || !bu.notCommandMessages[msg.channel.guild.id][msg.id]))
            bu.send(msg, `**${msg.author.username}** deleted their command message.`);
        bu.commandMessages[msg.channel.guild.id].splice(bu.commandMessages[msg.channel.guild.id].indexOf(msg.id), 1);
        if (bu.notCommandMessages && bu.notCommandMessages[msg.channel.guild.id] && bu.notCommandMessages[msg.id])
            delete bu.notCommandMessages[msg.guild.id][msg.id];
    }
    if (storedGuild.settings.makelogs)
        if (msg.channel.id != '204404225914961920') {
            try {
                bu.insertChatlog(msg, 2);
            } catch (err) {
                console.error(err);
            }
        }
    let newMsg;
    if (storedGuild.settings.makelogs)
        newMsg = msg.content || 'No content to display. This is either due to the message only containing an attachment, or existing before makelogs was set to true';
    else
        newMsg = 'uncached :(\nPlease enable chatlogging to use this functionality (`b!settings makelogs true`)';
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

bot.on('messageDeleteBulk', function (msgs) {
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
