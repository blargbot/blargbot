var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};


e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'unban <userid> [flags]';
e.info = 'Unbans a user.\nIf mod-logging is enabled, the unban will be logged.';
e.longinfo = `<p>Unbans a user.</p>
    <p>If mod-logging is enabled, the unban will be logged.</p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the unban.'
}];

e.execute = async function (msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length > 0) {
        var user = await bu.getUser(msg, words[1]);
        if (!user) {
            bu.send(msg, `I couldn't find that user. Please make sure you're giving me a user id or a mention.`);
            return;
        }
        let response = await e.unban(msg, user, input.r);
        bu.send(msg, response[0]);
    }
};

e.unban = async function (msg, user, reason, tag = false, noPerms = false) {
    if (msg.channel.guild.members.get(bot.user.id).permission.json.banMembers) {
        let banPerms = await bu.guildSettings.get(msg.guild.id, 'banoverride') || 0;
        if (noPerms || (bu.comparePerms(msg.member, banPerms) || msg.member.permission.json.banMembers)) {
            if (!bu.unbans[msg.channel.guild.id])
                bu.unbans[msg.channel.guild.id] = {};
            bu.unbans[msg.channel.guild.id][user.id] = {
                mod: noPerms ? bot.user : msg.author,
                type: tag ? 'Tag Unban' : 'Unban',
                reason: reason
            };
            try {
                await bot.unbanGuildMember(msg.channel.guild.id, user.id, 'Unbanned by ' + bu.getFullName(msg.author) + (reason ? ' with reason: ' + reason : ''));
                return [':ok_hand:', 'Success'];
            } catch (err) {
                return [`Failed to unban the user! Please check your permission settings and command and retry. \nIf you still can't get it to work, please report it to me by doing \`b!report <your issue>\` with the following:\`\`\`\n${err.message}\n${err.response}\`\`\``, '`Couldn\'t unban user`'];
            }
        } else {
            return [`You don't have permission to unban users!`, '`User has no permissions`'];
        }
    } else {
        return [`I don't have permission to unban users!`, '`Bot has no permissions`'];
    }
};

e.event = async function (args) {
    if (!bu.unbans[args.guild]) bu.unbans[args.guild] = {};
    bu.unbans[args.guild][args.user] = {
        mod: bot.user.id,
        reason: `Automatically unbanned after ${dep.moment.duration(args.duration).humanize()}.`
    };
    await bot.unbanGuildMember(args.guild, args.user, 'Automatic unban after time');
};