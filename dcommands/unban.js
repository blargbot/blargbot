var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.requireCtx = require

e.isCommand = true;
e.hidden = false
e.usage = 'unban <userid>';
e.info = 'Unbans a user.';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words, text) => {
    if (msg.channel.guild.members.get(bot.user.id).permission.json['banMembers']) {
        if (msg.member.permission.json['banMembers']) {
            if (words[1]) {
                var userid = words[1]
                

                if (!bu.unbans[msg.channel.guild.id])
                    bu.unbans[msg.channel.guild.id] = {}
                bu.unbans[msg.channel.guild.id][userid] = msg.author.id
                
                bot.unbanGuildMember(msg.channel.guild.id, userid)
                                bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:')

            //    bu.logAction(msg.channel.guild, user, msg.author, 'Ban')
            }
            //bot.ban
        } else {
            bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to unban users!`)
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to unban users!`)
    }
}