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
        var includeOffline = true;
        if (words[1] && words[1].toLowerCase() == 'online') {
            includeOffline = false;
        }
        var mods = msg.channel.guild.members.filter(m => {
            return !m.user.bot && bu.isStaff(m)
                && (includeOffline || m.status == 'online');
        });
        var maxLength = 0;
        mods.forEach(m => {
            if (getName(m).length > maxLength) {
                maxLength = getName(m).length;
            }
        });
        var message = '';
        mods.forEach(m => {
            //    console.log(m.status)
            message += `${(m.status == 'online'
                ? '<:vpOnline:212789758110334977>'
                : (m.status == 'idle'
                    ? '<:vpAway:212789859071426561>'
                    : '<:vpOffline:212790005943369728>'))} **${getName(m)}** (${m.user.id})\n`;
        });
        bu.sendMessageToDiscord(msg.channel.id, message);
    } catch (err) {
        console.log(err);
    }
};
function getName(member) {
    return member.user.username;
}

function pad(value, length) {
    return (value.toString().length < length) ? pad(value + ' ', length) : value;
}