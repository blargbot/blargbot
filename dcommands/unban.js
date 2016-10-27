var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'unban <userid>';
e.info = 'Unbans a user.\nIf mod-logging is enabled, the unban will be logged.';
e.longinfo = `<p>Unbans a user.</p>
    <p>If mod-logging is enabled, the unban will be logged.</p>`;

e.execute = (msg, words) => {
    if (msg.channel.guild.members.get(bot.user.id).permission.json.banMembers) {
        if (msg.member.permission.json.banMembers) {
            if (words[1]) {
                var userid = words[1];


                if (!bu.unbans[msg.channel.guild.id])
                    bu.unbans[msg.channel.guild.id] = {};
                bu.unbans[msg.channel.guild.id][userid] = msg.author.id;

                bot.unbanGuildMember(msg.channel.guild.id, userid);
                bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');

                //    bu.logAction(msg.channel.guild, user, msg.author, 'Ban')
            }
            //bot.ban
        } else {
            bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to unban users!`);
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to unban users!`);
    }
};