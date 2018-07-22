/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:22:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-07-12 22:15:06
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const bbEngine = require('../structures/bbtag/Engine');

bot.on('guildMemberRemove', async function (guild, member) {
    let val = await bu.guildSettings.get(guild.id, 'farewell');
    let chan = await bu.guildSettings.get(guild.id, 'farewellchan');
    if (chan && val) {
        let ccommandContent;
        let author, authorizer;
        if (typeof val == "object") {
            ccommandContent = val.content;
            author = val.author;
            authorizer = val.authorizer;
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
            limits: bbtag.limits.ccommand,
            tagContent: ccommandContent,
            input: '',
            isCC: true,
            tagName: 'farewell',
            author,
            authorizer
        });
    }
    bu.logEvent(guild.id, member.user.id, 'memberleave', [{
        name: 'User',
        value: bu.getFullName(member.user) + ` (${member.user.id})`,
        inline: true
    }]);

    let e = await bu.getAudit(guild.id, member.user.id, 20);
    if (e && Date.now() - bu.unmakeSnowflake(e.id) <= 1000) {
        let mod = bot.users.get(e.user.id);
        bu.logAction(
            guild,
            member,
            mod,
            'Kick',
            e.reason,
            bu.ModLogColour.KICK);
    }
});
