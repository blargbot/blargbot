/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:22:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:22:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildMemberRemove', async function(guild, member) {
    let val = await bu.guildSettings.get(guild.id, 'farewell');
    let chan = await bu.guildSettings.get(guild.id, 'farewellchan');
    if (val) {
        let ccommandContent;
        let author;
        if (typeof val == "object") {
            ccommandContent = val.content;
            author = val.author;
        } else {
            ccommandContent = val;
        }
        var message = await tags.processTag({
            channel: chan ? bot.getChannel(chan) : guild.defaultChannel,
            author: member.user,
            member: member,
            guild: guild
        }, ccommandContent, '', undefined, author, true);
        bu.send(chan || guild.defaultChannel.id, {
            content: message,
            disableEveryone: false
        });
    }
    bu.logEvent(guild.id, 'memberleave', [{
        name: 'User',
        value: bu.getFullName(member.user) + ` (${member.user.id})`,
        inline: true
    }]);
});