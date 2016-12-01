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

e.execute = async function(msg, words) {
    if (msg.channel.guild.members.get(bot.user.id).permission.json.banMembers) {
        if (msg.member.permission.json.banMembers) {
            if (words[1]) {
                var user = await bu.getUser(msg, words[1]);
                if (!user) {
                    bu.send(msg, `I couldn't find that user. Please make sure you're giving me a user id or a mention.`)
                    return;
                }
                logger.debug(require('util').inspect(user));

                if (!bu.unbans[msg.channel.guild.id])
                    bu.unbans[msg.channel.guild.id] = {};
                let input = bu.parseInput(e.flags, words);
                bu.unbans[msg.channel.guild.id][user.id] = {
                    mod: msg.author.id,
                    reason: input.r
                };

                await bot.unbanGuildMember(msg.channel.guild.id, user.id);
                bu.send(msg, ':ok_hand:');
            }
        } else {
            bu.send(msg, `You don't have permission to unban users!`);
        }
    } else {
        bu.send(msg, `I don't have permission to unban users!`);
    }
};

e.event = async function(args) {
    if (!bu.unbans[args.guild]) bu.unbans[args.guild] = {};
    bu.unbans[args.guild][args.user] = {
        mod: bot.user.id,
        reason: `Automatically unbanned after ${bu.parseDuration(args.duration).humanize()}.`
    };
    await bot.unbanGuildMember(args.guild, args.user);
};