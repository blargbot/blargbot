var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'kick <user>';
e.info = 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.';
e.longinfo = `<p>Kicks a user from the guild.</p>
    <p>If mod-logging is enabled, the kick will be logged.</p>`;
e.execute = (msg, words) => {
    if (!msg.channel.guild.members.get(bot.user.id).permission.json.kickMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to kick users!`);
        return;
    }
    if (!msg.member.permission.json.kickMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to kick users!`);
        return;
    }


    if (words[1]) {
        var user = bu.getUserFromName(msg, words[1]);
        if (!user) {
            bu.logger.debug('There was no user.');
            return;
        }
        var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
        var userPos = bu.getPosition(msg.member);
        var targetPos = bu.getPosition(msg.channel.guild.members.get(user.id));
        if (targetPos >= botPos) {
            bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to kick ${user.username}!`);
            return;
        }
        if (targetPos >= userPos) {
            bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to kick ${user.username}!`);
            return;
        }

        //     if (!bu.bans[msg.channel.guild.id])
        //         bu.bans[msg.channel.guild.id] = {}
        ///     bu.bans[msg.channel.guild.id][user.id] = msg.author.id
        //     var deletedays = 0
        //    if (words[2])
        //       deletedays = parseInt(words[2])
        bot.kickGuildMember(msg.channel.guild.id, user.id);
        bu.logAction(msg.channel.guild, user, msg.author, 'Kick');
        bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');

    } else {
        bu.send(msg.channel.id, `You didn't tell me who to kick!`);
    }
    //bot.ban

};