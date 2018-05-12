/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:42
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 11:21:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildDelete', async function (guild) {
    bu.postStats();
    bu.Metrics.guildGauge.dec();
    console.debug('removed from guild');
    let members = guild.memberCount;
    if (guild.members) {
        let users = guild.members.filter(m => !m.user.bot).length;
        let bots = guild.members.filter(m => m.user.bot).length;
        let percent = Math.floor(bots / members * 10000) / 100;
        var message = `:x: Guild: \`${guild.name}\`` +
            ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
        bu.send(`205153826162868225`, message);
    }

    r.table('guild').get(guild.id).update({
        active: false
    }).run();/*
    let channel = await bot.getDMChannel(guild.ownerID);
    bu.send(channel.id, `Hi!
I see I was removed from your guild **${guild.name}**, and I'm sorry I wasn't able to live up to your expectations.
If it's not too much trouble, could you please tell me why you decided to remove me, what you didn't like about me, or what you think could be improved? It would be very helpful.
You can do this by typing \`feedback <your feedback here>\` right in this DM (don't include the <>). Thank you for your time!`);*/
});