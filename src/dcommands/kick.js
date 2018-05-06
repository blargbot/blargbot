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
    if (!words[1]) {
        bu.send(msg, `You didn't tell me who to kick!`);
        return;
    }

    let target = await bu.getUser(msg, words[1]);
    let reason = bu.parseInput(e.flags, words).r;

    if (!target) return;

    let state = await e.kick(msg, target, reason, false, false);
    let response;
    switch (state) {
        case 0: //Successful
            response = `:ok_hand:`;
            break;
        case 1: //Bot doesnt have perms
            response = `I don't have permission to kick users!`;
            break;
        case 2: //Bot cannot kick target
            response = `I don't have permission to kick ${target.username}!`;
            break;
        case 3: //User doesnt have perms
            response = `You don't have permission to kick users!`;
            break;
        case 4: //User cannot kick target
            response = `You don't have permission to kick ${target.username}!`;
            break;
        default: //Error occurred
            response = `Failed to kick the user! Please check your permission settings and command and retry. \nIf you still can't get it to work, please report it to me by doing \`b!report <your issue>\` with the following:\`\`\`\n${state.message}\n${state.response}\`\`\``;
            break;
    }

    bu.send(msg, response);
};

// returns success code
// Error Object = Unknown error
// 0 = successful
// 1 = bot doesnt have kick permission
// 2 = bot cannot kick target
// 3 = user doesnt have kick permission
// 4 = user cannot kick target
// 5 = user not in guild

e.kick = async function (msg, target, reason, tag = false, noPerms = false) {
    if (!msg.channel.guild.members.get(bot.user.id).permission.json.kickMembers)
        return 1;
    let kickPerms = await bu.guildSettings.get(msg.guild.id, 'kickoverride') || 0;
    if (!noPerms && !bu.comparePerms(msg.member, kickPerms) && !msg.member.permission.json.kickMembers)
        return 3;

    var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
    var userPos = bu.getPosition(msg.member);
    var targetPos = bu.getPosition(msg.channel.guild.members.get(target.id));
    if (targetPos >= botPos)
        return 2;
    if (!noPerms && targetPos >= userPos && msg.author.id != msg.guild.ownerID)
        return 4;

    try {
        await bot.kickGuildMember(
            msg.channel.guild.id,
            target.id,
            'Kicked by ' + bu.getFullName(msg.author) + (reason ? ' with reason: ' + reason : '')
        );
        bu.logAction(
            msg.channel.guild,
            target,
            msg.author,
            tag ? 'Tag Kick' : 'Kick',
            reason,
            bu.ModLogColour.KICK);
        return 0;
    }
    catch (err) {
        console.error(err);
        return err;
    }
}