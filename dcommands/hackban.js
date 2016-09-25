var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    e.category = bu.CommandType.ADMIN;
};
e.isCommand = true;
e.requireCtx = require;

e.hidden = false;
e.usage = 'hackban <user> [days]';
e.info = 'Bans a user who isn\'t currently on your guild, where `days` is the number of days to delete messages for (defaults to 1).\nIf mod-logging is enabled, the ban will be logged.';
e.longinfo = `<p>Bans a user who isn't currently on your guild, where <code>days</code> is the number of days to delete messages for. Defaults to 1.</p>
<p>If mod-logging is enabled, the ban will be logged.</p>`;



e.execute = (msg, words, text) => {
    if (!msg.channel.guild.members.get(bot.user.id).permission.json.banMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to ban users!`);
        return;
    }
    if (!msg.member.permission.json.banMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to ban users!`);
        return;
    }



    if (words[1]) {
        var user = bu.getUserFromName(msg, words[1], true);
        if (user) {
            bu.send(msg.channel.id, 'That user is here! Please do `ban` instead.');
            return;
        }
        var userId;
        if (/[0-9]{17,21}/.test(text)) {
            userId = text.match(/([0-9]{17,21})/)[1];
        } else {
            bu.send(msg.channel.id, `That wasn't an ID or a mention. Please try again.`);
        }

        if (!bu.bans[msg.channel.guild.id])
            bu.bans[msg.channel.guild.id] = {};
        bu.bans[msg.channel.guild.id][user.id] = msg.author.id;
        var deletedays = 1;
        if (words[2])
            deletedays = parseInt(words[2]);
        bot.banGuildMember(msg.channel.guild.id, userId, deletedays).then(() => {
            bu.logAction(msg.channel.guild, {
                id: userId,
                username: 'Unknown',
                discriminator: '????'    
            }, msg.author, 'Hack-Ban');
        });
        bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
    }
    //bot.ban

};
