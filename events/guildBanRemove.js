const moment = require('moment');

bot.on('guildBanRemove', async function(guild, user) {
    let storedGuild = await bu.getGuild(guild.id);
    let modlog = storedGuild.modlog || [];
    let lastCase = modlog[modlog.length - 1];
    var mod;
    let reason;
    if (bu.unbans[guild.id] && bu.unbans[guild.id][user.id]) {
        mod = bot.users.get(bu.unbans[guild.id][user.id].mod);
        reason = bu.unbans[guild.id][user.id].reason;
        delete bu.unbans[guild.id][user.id];
    }
    logger.debug(reason);
    if (lastCase && lastCase.userid == user.id) {
        let val = await bu.guildSettings.get(guild.id, 'modlog');

        let msg2 = await bot.getMessage(val, lastCase.msgid);
        let embed = msg2.embeds[0];
        if (embed && (moment() - embed.timestamp) <= 60000) {
            embed.fields[0].value = 'Softban';
            embed.color = 0xffee02;
            embed.timestamp = moment(embed.timestamp);

            msg2.edit({
                content: ' ',
                embed: embed
            });
        } else {
            bu.logAction(guild, user, mod, 'Unban', reason);
        }
    } else {
        bu.logAction(guild, user, mod, 'Unban', reason);
    }
    bu.logEvent(guild.id, 'memberunban', [{
        name: 'User',
        value: bu.getFullName(user) + ` (${user.id})`,
        inline: true
    }]);
});