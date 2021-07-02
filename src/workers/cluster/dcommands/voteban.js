const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class VotebanCommand extends BaseCommand {
    constructor() {
        super({
            name: 'voteban',
            aliases: ['pollban', 'vb', 'pb'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'voteban [info <user> | <user> [reason]]',
            info: 'Sign a petition to ban somebody, or check the status of a petition. If no arguments are provided, get the most signed petitions.'
        });
    }

    async execute(msg, words, text) {
        let storedGuild = await bu.getGuild(msg.guild.id);
        let votebans = storedGuild.votebans || {};
        if (words.length > 1) {
            if (words[1].toLowerCase() == 'info') {
                let user = await bu.getUser(msg, words.slice(2).join(' '));

                if (!votebans.hasOwnProperty(user.id))
                    bu.send(msg, `Nobody has signed to ban **${bu.getFullName(user)}**!`);
                else {
                    let userList = [];
                    for (let userId of votebans[user.id]) {
                        let tempUser;
                        if (typeof userId == "string") {
                            tempUser = bot.users.get(userId) || await bot.getRESTUser(userId);

                            userList.push(`**${bu.getFullName(tempUser)}**`);
                        } else {
                            tempUser = bot.users.get(userId.id) || await bot.getRESTUser(userId.id);
                            userList.push(`**${bu.getFullName(tempUser)}** ${userId.reason ? ' - ' + userId.reason : ''}`);
                        }
                    }
                    bu.send(msg, `**${userList.length}** ${userList.length == 1 ? 'person has' : 'people have'} signed to ban **${bu.getFullName(user)}**.
${userList.map(u => {
                        return ' - ' + u;
                    }).join('\n')}`);
                }
            } else {
                let user = await bu.getUser(msg, words[1]);
                if (!user) return;
                let reason = words[2] ? words.slice(2).join(' ') : undefined;
                if (reason) reason = await bu.filterMentions(reason);
                if (!votebans.hasOwnProperty(user.id))
                    votebans[user.id] = [];

                let tempVotebans = votebans[user.id] != undefined ? votebans[user.id].map(u => u.id) : [];


                if (tempVotebans.indexOf(msg.author.id) > -1) {
                    votebans[user.id].splice(tempVotebans.indexOf(msg.author.id), 1);
                    bu.send(msg, `**${bu.getFullName(msg.author)}** no longer wants to ban **${bu.getFullName(user)}**! Total signatures: **${votebans[user.id].length}**`);
                } else {
                    votebans[user.id].push({
                        id: msg.author.id,
                        reason: reason
                    });
                    bu.send(msg, `**${bu.getFullName(msg.author)}** has signed to ban **${bu.getFullName(user)}**! Total signatures: **${votebans[user.id].length}**
${reason ? '**Reason:** ' + reason : ''}`);
                }
                console.debug(votebans);
                await r.table('guild').get(msg.guild.id).update({
                    votebans: votebans
                });
            }

        } else {
            console.debug(votebans);
            let votebanStats = [];
            for (let key in votebans) {
                votebanStats.push({
                    id: key,
                    votes: votebans[key].length
                });
            }
            votebanStats = votebanStats.filter(v => v.votes > 0);
            votebanStats.sort((a, b) => {
                return b.votes - a.votes;
            });
            votebanStats = votebanStats.slice(0, 10);
            let returnMsg = '';
            if (votebanStats.length > 0)
                returnMsg = `The **__Top ${votebanStats.length}__** most wanted!\n`;
            else returnMsg = `There's nobody here to ban.`;
            let i = 1;
            for (let stat of votebanStats) {
                let user = bot.users.get(stat.id) || await bot.getRESTUser(stat.id);
                returnMsg += `**${i}**. **${bu.getFullName(user)}** (${user.id}) - **${stat.votes}** signatures\n`;
                i++;
            }
            bu.send(msg, returnMsg);
        }
    }
}

module.exports = VotebanCommand;
