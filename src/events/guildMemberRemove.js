/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:22:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-15 14:39:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const bbEngine = require('../structures/bbtag/Engine');

bot.on('guildMemberRemove', async function (guild, member) {
    let val = await bu.guildSettings.get(guild.id, 'farewell');
    let chan = await bu.guildSettings.get(guild.id, 'farewellchan');
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
            tagName: 'farewell',
            author
        });
    }
    bu.logEvent(guild.id, member.user.id, 'memberleave', [{
        name: 'User',
        value: bu.getFullName(member.user) + ` (${member.user.id})`,
        inline: true
    }]);
});