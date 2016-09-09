var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'kick <user>';
e.info = 'Kicks a user.';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words) => {
    if (!msg.channel.guild.members.get(bot.user.id).permission.kickMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to kick users!`);
        return;

    }
    if (!msg.member.permission.json.kickMembers) {
        bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to kick users!`);
        return;
    }


    if (words[1]) {
        var user = bu.getUserFromName(msg, words[1]);
        if (!user)
            return;
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
        bot.deleteGuildMember(msg.channel.guild.id, user.id);
        bu.logAction(msg.channel.guild, user, msg.author, 'Kick');
        bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');

    }
    //bot.ban

};