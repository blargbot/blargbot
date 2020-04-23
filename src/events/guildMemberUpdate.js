/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-21 09:54:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildMemberUpdate', async (guild, member, oldMember) => {
    if (member && oldMember) {
        if (member.user.id !== bot.user.id) {
            bu.processUser(member.user);
            if (member.nick != oldMember.nick) {
                let fields = [];
                let description = 'Nickname Changed';
                fields.push({
                    name: 'User',
                    value: `${member.user.username}#${member.user.discriminator} (${member.user.id})`,
                    inline: true
                });
                fields.push({
                    name: 'Old Nickname',
                    value: oldMember.nick || member.user.username,
                    inline: true
                });
                fields.push({
                    name: 'New Nickname',
                    value: member.nick || member.user.username,
                    inline: true
                });

                bu.logEvent(guild.id, member.user.id, 'nickupdate', fields, {
                    thumbnail: {
                        url: member.user.avatarURL
                    },
                    description
                });
            }

            let newRoles = member.roles.filter(r => !oldMember.roles.includes(r)).map(r => ({ id: r, s: 'role:' + r + ':add' }));

            let remRoles = oldMember.roles.filter(r => !member.roles.includes(r)).map(r => ({ id: r, s: 'role:' + r + ':remove' }));

            let roles = [].concat(newRoles, remRoles);

            if (roles.length > 0) {
                let e = await bu.getAudit(guild.id, member.user.id, 25);
                for (const role of roles) {
                    let r = guild.roles.get(role.id);
                    if (!r) continue;
                    let fields = [{
                        name: 'User',
                        value: `${member.user.username}#${member.user.discriminator} (${member.user.id})`
                    }, {
                        name: 'Role',
                        value: `<@&${r.id}> (${r.id})`
                    }];
                    if (e && e.user.id !== member.user.id) fields.push({
                        name: 'Updated By',
                        value: `${bu.getFullName(e.user)} (${e.user.id})`
                    });
                    if (e && e.reason) fields.push({
                        name: 'Reason',
                        value: e.reason
                    });
                    bu.logEvent(guild.id, member.user.id, role.s, fields);
                }
            }
        }
    }
});