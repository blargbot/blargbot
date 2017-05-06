var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'kick <user> [flags]';
e.info = 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.';
e.longinfo = `<p>Kicks a user from the guild.</p>
    <p>If mod-logging is enabled, the kick will be logged.</p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the kick.'
}];

e.execute = async function (msg, words) {
    if (!msg.channel.guild.members.get(bot.user.id).permission.json.kickMembers) {
        bu.send(msg, `I don't have permission to kick users!`);
        return;
    }
    let kickPerms = await bu.guildSettings.get(msg.guild.id, 'kickoverride') || 0;
    if (!bu.comparePerms(msg.member, kickPerms) && !msg.member.permission.json.kickMembers) {
        bu.send(msg, `You don't have permission to kick users!`);
        return;
    }


    if (words[1]) {
        var user = await bu.getUser(msg, words[1]);
        if (!user) {
            logger.debug('There was no user.');
            return;
        }
        var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
        var userPos = bu.getPosition(msg.member);
        var targetPos = bu.getPosition(msg.channel.guild.members.get(user.id));
        if (targetPos >= botPos) {
            bu.send(msg, `I don't have permission to kick ${user.username}!`);
            return;
        }
        if (targetPos >= userPos) {
            bu.send(msg, `You don't have permission to kick ${user.username}!`);
            return;
        }

        //     if (!bu.bans[msg.channel.guild.id])
        //         bu.bans[msg.channel.guild.id] = {}
        ///     bu.bans[msg.channel.guild.id][user.id] = msg.author.id
        //     var deletedays = 0
        //    if (words[2])
        //       deletedays = parseInt(words[2])
        try {
            await bot.kickGuildMember(msg.channel.guild.id, user.id, 'Kicked by ' + bu.getFullName(msg.author) + (input.r ? ' with reason: ' + input.r.join(' ') : ''));
            let input = bu.parseInput(e.flags, words);
            bu.logAction(msg.channel.guild, user, msg.author, 'Kick', input.r, bu.ModLogColour.KICK);
            bu.send(msg, ':ok_hand:');
        } catch (err) {
            bu.send(msg, `Failed to kick the user! Please check your permission settings and command and retry. \nIf you still can't get it to work, please report it to me by doing \`b!report <your issue>\` with the following:\`\`\`\n${err.message}\n${err.response}\`\`\``);
            throw err;
        }
    } else {
        bu.send(msg, `You didn't tell me who to kick!`);
    }
    //bot.ban

};