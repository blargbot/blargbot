bot.on('guildBanAdd', async function (guild, user) {

    let storedGuild = await bu.getGuild(guild.id);
    let votebans = storedGuild.votebans || {};
    logger.debug(0, votebans);
    if (votebans.hasOwnProperty(user.id)) {
        logger.debug(1, votebans);
        delete votebans[user.id];
        logger.debug(2, votebans);
        r.table('guild').get(guild.id).update({
            votebans: r.literal(votebans)
        });
    }
    var mod;
    var type = 'Ban';
    var reason;
    if (!bu.bans[guild.id])
        bu.bans[guild.id] = {};

    if (bu.bans[guild.id].mass && bu.bans[guild.id].mass.users && bu.bans[guild.id].mass.users.indexOf(user.id) > -1) {
        bu.bans[guild.id].mass.newUsers.push(user);
        bu.bans[guild.id].mass.users.splice(bu.bans[guild.id].mass.users.indexOf(user.id), 1);
        if (bu.bans[guild.id].mass.users.length == 0) {
            mod = bu.bans[guild.id].mass.mod;
            type = bu.bans[guild.id].mass.type;
            reason = bu.bans[guild.id].mass.reason;
            bu.logAction(guild, bu.bans[guild.id].mass.newUsers, mod, type, reason, bu.ModLogColour.BAN);
        }
        return;
    } else if (bu.bans[guild.id][user.id]) {
        mod = bu.bans[guild.id][user.id].mod;
        type = bu.bans[guild.id][user.id].type;
        reason = bu.bans[guild.id][user.id].reason;
        delete bu.bans[guild.id][user.id];
    }
    bu.logAction(guild, user, mod, type, reason, bu.ModLogColour.BAN);
    bu.logEvent(guild.id, 'memberban', [{
        name: 'User',
        value: bu.getFullName(user) + ` (${user.id})`,
        inline: true
    }]);
});