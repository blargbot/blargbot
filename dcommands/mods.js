var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'mods [online | o | away | a | dnd | d | offline]';
e.info = `Gets a list of mods.`;
e.longinfo = `<p>Gets a list of mods on the guild.</p>`;

e.execute = (msg, words) => {
    try {
        bu.guildSettings.get(msg.channel.guild.id, 'staffperms').then(val => {
            var allow = val || bu.defaultStaff;
            let status = 0;
            if (words[1])
                switch (words[1].toLowerCase()) {
                    case 'o':
                    case 'online':
                        status = 1;
                        break;
                    case 'a':
                    case 'away':
                        status = 2;
                        break;
                    case 'd':
                    case 'dnd':
                        status = 3;
                        break;
                    case 'offline':
                        status = 4;
                        break;
                }
            var includeOffline = true;
            if (words[1] && words[1].toLowerCase() == 'online') {
                includeOffline = false;
            }
            var mods = msg.channel.guild.members.filter(m => {
                return !m.user.bot && bu.comparePerms(m, allow) &&
                    (includeOffline || m.status == 'online');
            });
            var maxLength = 0;
            mods.forEach(m => {
                if (getName(m).length > maxLength) {
                    maxLength = getName(m).length;
                }
            });
            var message = '';
            let online = [];
            if (status == 0 || status == 1)
                mods.filter(m => m.status == 'online').forEach(m => {
                    online.push(`<:vpOnline:212789758110334977> **${getName(m)}** (${m.user.id})`);
                });
            let away = [];
            if (status == 0 || status == 2)
                mods.filter(m => m.status == 'idle').forEach(m => {
                    away.push(`<:vpAway:212789859071426561> **${getName(m)}** (${m.user.id})`);
                });
            let dnd = [];
            if (status == 0 || status == 3)
                mods.filter(m => m.status == 'dnd').forEach(m => {
                    dnd.push(`<:vpDnD:236744731088912384> **${getName(m)}** (${m.user.id})`);
                });
            let offline = [];
            if (status == 0 || status == 4)
                mods.filter(m => m.status == 'offline').forEach(m => {
                    offline.push(`<:vpOffline:212790005943369728> **${getName(m)}** (${m.user.id})`);
                });

            let embed = {
                title: `Mods on **${msg.guild.name}**`,
                fields: [],
                color: bu.avatarColours[bu.avatarId],
                description: `Here's a list of mods:`
            }
            if (online.length > 0) embed.fields.push({
                name: 'Online',
                value: online.join('\n')
            });
            if (away.length > 0) embed.fields.push({
                name: 'Away',
                value: away.join('\n')
            });
            if (dnd.length > 0) embed.fields.push({
                name: 'Do Not Disturb',
                value: dnd.join('\n')
            });
            if (offline.length > 0) embed.fields.push({
                name: 'Offline',
                value: offline.join('\n')
            });
            logger.debug(embed.fields);
            if (embed.fields.length == 0) {
                embed.description = 'Whoops! There are no mods with that status!';
            }
            bu.send(msg, {
                embed: embed
            });
        });

    } catch (err) {
        logger.error(err);
    }
};

function getName(member) {
    return member.user.username;
}

function pad(value, length) {
    return (value.toString().length < length) ? pad(value + ' ', length) : value;
}