const BaseCommand = require('../structures/BaseCommand');

class KickCommand extends BaseCommand {
    constructor() {
        super({
            name: 'kick',
            category: bu.CommandType.ADMIN,
            usage: 'kick <user> [flags]',
            info: 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.',
            flags: [{ flag: 'r', word: 'reason', desc: 'The reason for the kick.' }]
        });
    }

    async execute(msg, words, text) {
        if (words[1]) {
            let input = bu.parseInput(this.flags, words);
            
            let user = await bu.getUser(msg, input.undefined[0]);
            if (!user) {
                return await bu.send(msg, `I couldn't find that user. Try again with their ID or a mention instead.`);
            }
            
            let target = await bu.getUser(msg, words[1]);     //unused
            let reason = bu.parseInput(this.flags, words).r;

            if (!target) return;
            
            bu.send(msg, (await this.kick(msg, user, reason))[0]);
            
        } else bu.send(msg, `You didn't tell me who to kick!`);
    }

    async kick(msg, user, reason, tag = false, noPerms = false) {
        if (!msg.channel.guild.members.get(bot.user.id).permissions.json.kickMembers) {
            return [`I don't have permission to kick users!`, '`Bot has no permissions`'];
        }
        let kickPerms = await bu.guildSettings.get(msg.guild.id, 'kickoverride') || 0;
        if (!noPerms && !bu.comparePerms(msg.member, kickPerms) && !msg.member.permissions.json.kickMembers) {
            return [`You don't have permission to kick users!`, '`User has no permissions`'];
        }
        
        const member = msg.guild.members.get(user.id);
        
        if(!member) {
            return [`${user.username} isnt on this server!`, '`User not in guild`'];
        }
        const botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
        const userPos = bu.getPosition(msg.member);
        const targetPos = bu.getPosition(member);
        if (targetPos >= botPos) {
            return [`I don't have permission to kick ${user.username}!`, '`Bot has no permissions`'];
        }
        if (!noPerms && targetPos >= userPos && msg.author.id != msg.guild.ownerID) {
            return [`You don't have permission to kick ${user.username}!`, '`User has no permissions`'];
        }

        try {
            const fullReason = encodeURIComponent((tag ? '' : `[ ${bu.getFullName(msg.author)} ]`)
                + (reason ? ' ' + (Array.isArray(reason) ? reason.join(' ') : reason) : ''));

            await bot.kickGuildMember(
                msg.channel.guild.id,
                member.id,
                fullReason
            );

            if (reason)
                return [`:ok_hand: Kicked ${user.username}. Reason: ${reason}`, 'Success'];
            return [`:ok_hand: Kicked ${user.username}.`, 'Success'];
        } catch (err) {
            console.error(err);
            //return err;
            return [`Failed to kick the user! Please check your permission settings and command and retry. \nIf you still can't get it to work, please report it to me by doing \`b!report <your issue>\` with the following:\`\`\`\n${err.message}\n${err.response}\`\`\``, err];
        }
    }
}

module.exports = KickCommand;
