var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.isCommand = true;
e.requireCtx = require;
e.hidden = false;
e.usage = 'ban <user> [days]';
e.info = 'Bans a user, where `days` is the number of days to delete messages for (defaults to 1).\nIf mod-logging is enabled, the ban will be logged.';
e.longinfo = `<p>Bans a user, where <code>days</code> is the number of days to delete messages for. Defaults to 1.</p>
<p>If mod-logging is enabled, the ban will be logged.</p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the ban.'
}];


e.execute = async function(msg, words) {
    if (!msg.channel.guild.members.get(bot.user.id).permission.json.banMembers) {
        bu.send(msg, `I don't have permission to ban users!`);
        return;
    }
    if (!msg.member.permission.json.banMembers) {
        bu.send(msg, `You don't have permission to ban users!`);
        return;
    }



    if (words[1]) {
        var user = await bu.getUser(msg, words[1]);
        if (!user) {
            bu.send(msg, `I couldn't find that user. Try using \`hackban\` with their ID or a mention instead.`);
            return;
        }
        let member = msg.guild.members.get(user.id);
        if (!member) {
            bu.send(msg, `That user isn't on this guild. Try using \`hackban\` with their ID or a mention instead.`);
            return;
        }
        var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
        var userPos = bu.getPosition(msg.member);
        var targetPos = bu.getPosition(msg.channel.guild.members.get(user.id));
        if (targetPos >= botPos) {
            bu.send(msg, `I don't have permission to ban ${user.username}!`);
            return;
        }
        if (targetPos >= userPos) {
            bu.send(msg, `You don't have permission to ban ${user.username}!`);
            return;
        }
        if (!bu.bans[msg.channel.guild.id])
            bu.bans[msg.channel.guild.id] = {};
        let input = bu.parseInput(e.flags, words);
        bu.bans[msg.channel.guild.id][user.id] = {
            mod: msg.author,
            type: 'Ban',
            reason: input.r
        };
        var deletedays = 1;
        if (words[2])
            deletedays = parseInt(words[2]);
        await bot.banGuildMember(msg.channel.guild.id, user.id, deletedays)
        bu.send(msg, ':ok_hand:');
    }
    //bot.ban

};