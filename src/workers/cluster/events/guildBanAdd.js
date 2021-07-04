/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:12
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:21:12
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
const { modlogColours } = require('../newbu');

bot.on('guildBanAdd', async function (guild, user) {

    let storedGuild = await bu.getGuild(guild.id);
    let votebans = storedGuild.votebans || {};
    console.debug(0, votebans);
    if (Object.prototype.hasOwnProperty.call(votebans, user.id)) {
        console.debug(1, votebans);
        delete votebans[user.id];
        console.debug(2, votebans);
        r.table('guild').get(guild.id).update({
            votebans: r.literal(votebans)
        });
    }
    let mod;
    let type = 'Ban';
    let reason;
    if (!bu.bans[guild.id])
        bu.bans[guild.id] = {};

    if (bu.bans[guild.id].mass && bu.bans[guild.id].mass.users && bu.bans[guild.id].mass.users.indexOf(user.id) > -1) {
        bu.bans[guild.id].mass.newUsers.push(user);
        bu.bans[guild.id].mass.users.splice(bu.bans[guild.id].mass.users.indexOf(user.id), 1);
        if (bu.bans[guild.id].mass.users.length == 0) {
            mod = bu.bans[guild.id].mass.mod;
            type = bu.bans[guild.id].mass.type;
            reason = bu.bans[guild.id].mass.reason;
            bu.logAction(guild, bu.bans[guild.id].mass.newUsers, mod, type, reason, modlogColours.BAN);
        }
        return;
    } else if (bu.bans[guild.id][user.id]) {
        mod = bu.bans[guild.id][user.id].mod;
        type = bu.bans[guild.id][user.id].type;
        reason = bu.bans[guild.id][user.id].reason;
        delete bu.bans[guild.id][user.id];
    }
    bu.logAction(guild, user, mod, type, reason, modlogColours.BAN);
    bu.logEvent(guild.id, user.id, 'memberban', [{
        name: 'User',
        value: bu.getFullName(user) + ` (${user.id})`,
        inline: true
    }]);
});
