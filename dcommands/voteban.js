var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'voteban <info <user> | <user>>';
e.info = 'Sign a petition to ban somebody, or check the status of a petition.';
e.longinfo = '<p>Sign a petition to ban somebody, or check the status of a petition.</p>';

e.execute = async function(msg, words, text) {
        if (words.length > 1) {
            let storedGuild = await bu.getGuild(msg.guild.id);
            let votebans = storedGuild.votebans || {};

            if (words[1].toLowerCase() == 'info') {
                let user = await bu.getUser(msg, words.slice(2).join(' '));

                if (!votebans.hasOwnProperty(user.id))
                    bu.send(msg, `Nobody has signed to ban **${bu.getFullName(user)}**!`);
                else {
                    let userList = [];
                    for (let userId of votebans[user.id]) {
                        userList.push(bot.users.get(userId) || await bot.getRESTUser(userId));
                    }
                    bu.send(msg, `**${userList.length}** ${userList.length == 1 ? 'person has' : 'people have'} signed to ban **${bu.getFullName(user)}**.
${userList.map(u => {
    return ` - **${bu.getFullName(u)}**`;
}).join('\n')}`);
            }
        } else {
            let user = await bu.getUser(msg, words.slice(1).join(' '));
            
            if (!votebans.hasOwnProperty(user.id))
                votebans[user.id] = [];
                
            if (votebans[user.id].indexOf(msg.author.id) > -1) {
                votebans[user.id].splice(votebans[user.id].indexOf(msg.author.id), 1);
                bu.send(msg, `**${bu.getFullName(msg.author)}** no longer wants to ban **${bu.getFullName(user)}**! Total signatures: **${votebans[user.id].length}**`);
            } else {
                votebans[user.id].push(msg.author.id);
                bu.send(msg, `**${bu.getFullName(msg.author)}** has signed to ban **${bu.getFullName(user)}**! Total signatures: **${votebans[user.id].length}**`);
            }
            await r.table('guild').get(msg.guild.id).update({
                votebans: votebans
            });
        }

    } else {
        bu.send(msg, 'You have to tell me who you want to ban!');
    }
};