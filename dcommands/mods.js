var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'mods [online]';
e.info = `Get's a list of mods.`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    var includeOffline = true;
    if (words[1] && words[1].toLowerCase() == 'online') {
        includeOffline = false;
    }
    var mods = msg.channel.guild.members.filter(m => {
        return !m.user.bot && bu.isStaff(m)
            && (includeOffline || m.status == 'online');
    });
    var message = '```xl\n';
    var maxLength = 0;
    mods.forEach(m => {
        if (getName(m).length > maxLength) {
            maxLength = getName(m).length;
        }
    });
    mods.forEach(m => {
    //    console.log(m.status)
        message += `${pad(getName(m), maxLength)} -${pad(m.status == 'online'
            ? ' Online'
            : (m.status == 'idle'
                ? "'idle' "
                : ' offline'), 8)} (${m.user.id})\n`;
    });
    message += '```';
    bu.sendMessageToDiscord(msg.channel.id, message);
};
function getName(member) {
    return member.user.username;
}

function pad(value, length) {
    return (value.toString().length < length) ? pad(value + " ", length) : value;
}