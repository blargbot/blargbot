/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-25 16:38:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildMemberUpdate', (guild, member, oldMember) => {
    if (member && oldMember) {
        if (member.user.id != bot.user.id) {
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

                bu.logEvent(guild.id, 'nickupdate', fields, {
                    thumbnail: {
                        url: member.user.avatarURL
                    },
                    description
                });
            }
        }
    }
});