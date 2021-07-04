/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-28 10:58:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('userUpdate', (user, oldUser) => {
    if (user && oldUser) {
        if (user.id != bot.user.id) {
            let guilds = bot.guilds.filter(g => g.members.get(user.id) != undefined);
            let fields;
            let description = '';

            if (oldUser.username != user.username || oldUser.discriminator != user.discriminator) {
                fields = [];
                if (oldUser.username != user.username) description += 'Username Changed\n';
                if (oldUser.discriminator != user.discriminator) description += 'Discriminator Changed\n';
                fields.push({
                    name: 'Old Name',
                    value: bu.getFullName(oldUser),
                    inline: true
                });
                fields.push({
                    name: 'New Name',
                    value: bu.getFullName(user),
                    inline: true
                });
                fields.push({
                    name: 'User ID',
                    value: user.id,
                    inline: true
                });

                guilds.forEach(g => {
                    bu.logEvent(g.id, user.id, 'nameupdate', fields, {
                        thumbnail: {
                            url: user.avatarURL
                        },
                        description
                    });
                });

            } else if (user.avatar != oldUser.avatar) {
                fields = [];
                fields.push({
                    name: 'User',
                    value: bu.getFullName(user),
                    inline: true
                });
                fields.push({
                    name: 'User ID',
                    value: user.id,
                    inline: true
                });
                guilds.forEach(g => {
                    bu.logEvent(g.id, user.id, 'avatarupdate', fields, {
                        image: {
                            url: user.avatarURL
                        },
                        thumbnail: {
                            url: `https://cdn.discordapp.com/avatars/${user.id}/${oldUser.avatar}.jpg`
                        },
                        description: ':arrow_right: Old avatar\n:arrow_down: New avatar'
                    });
                });
            }
        }
    }
});
