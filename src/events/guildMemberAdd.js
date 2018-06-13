/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-08 13:16:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
const bbEngine = require('../structures/BBTagEngine');

bot.on('guildMemberAdd', async function (guild, member) {
    bu.processUser(member.user);
    let val = await bu.guildSettings.get(guild.id, 'greeting');
    let chan = await bu.guildSettings.get(guild.id, 'greetchan');
    if (chan && val) {
        let ccommandContent;
        let author;
        if (typeof val == "object") {
            ccommandContent = val.content;
            author = val.author;
        } else {
            ccommandContent = val;
        }
        await bbEngine.runTag({
            msg: {
                channel: bot.getChannel(chan),
                author: member.user,
                member: member,
                guild: guild
            },
            tagContent: ccommandContent,
            input: '',
            isCC: true,
            tagName: 'greet',
            author
        });
    }
    bu.logEvent(guild.id, 'memberjoin', [{
        name: 'User',
        value: bu.getFullName(member.user) + ` (${member.user.id})\nMember #${guild.memberCount}`,
        inline: true
    }, {
        name: 'Created',
        value: dep.moment(member.user.createdAt).tz('Etc/GMT').format('llll') +
            ` GMT\n(${dep.moment.duration(-1 * (dep.moment() - dep.moment(member.user.createdAt))).humanize(true)})`,
        inline: false
    }]);
});