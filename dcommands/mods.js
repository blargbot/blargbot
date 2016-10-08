var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'mods [online]';
e.info = `Gets a list of mods.`;
e.longinfo = `<p>Gets a list of mods on the guild.</p>`;

e.execute = (msg, words) => {
    try {
        bu.guildSettings.get(msg.channel.guild.id, 'staffperms').then(val => {
            var allow = val || bu.defaultStaff;
            var includeOffline = true;
            if (words[1] && words[1].toLowerCase() == 'online') {
                includeOffline = false;
            }
            var mods = msg.channel.guild.members.filter(m => {
                return !m.user.bot && bu.comparePerms(m, allow)
                    && (includeOffline || m.status == 'online');
            });
            var maxLength = 0;
            mods.forEach(m => {
                if (getName(m).length > maxLength) {
                    maxLength = getName(m).length;
                }
            });
            var message = '';
            mods.filter(m => m.status == 'online').forEach(m => {
                message += `<:vpOnline:212789758110334977> **${getName(m)}** (${m.user.id})\n`;
            });
            mods.filter(m => m.status == 'idle').forEach(m => {
                message += `<:vpAway:212789859071426561> **${getName(m)}** (${m.user.id})\n`;
            });
            mods.filter(m => m.status == 'dnd').forEach(m => {
                message += `<:vpAway:212789859071426561> **${getName(m)}** (${m.user.id}) - DO NOT DISTURB\n`;
            });
            mods.filter(m => m.status == 'offline').forEach(m => {
                message += `<:vpOffline:212790005943369728> **${getName(m)}** (${m.user.id})\n`;
            });

            bu.sendMessageToDiscord(msg.channel.id, message);
        });

    } catch (err) {
        bu.logger.error(err);
    }
};
function getName(member) {
    return member.user.username;
}

function pad(value, length) {
    return (value.toString().length < length) ? pad(value + ' ', length) : value;
}