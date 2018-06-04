/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-03 23:01:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const blacklist = require('../../blacklist.json');

bot.on('guildCreate', async function (guild) {
    bu.Metrics.guildGauge.inc();

    if (blacklist.includes(guild.id)) {
        let owner = guild.members.get(guild.ownerID).user;
        let pc = await owner.getDMChannel();

        await pc.createMessage(`Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);

        return await guild.leave();
    }

    bu.postStats();
    console.debug('added to guild');

    let storedGuild = await bu.getGuild(guild.id);
    if (!storedGuild || !storedGuild.active) {
        let members = guild.memberCount;
        let users = guild.members.filter(m => !m.user.bot).length;
        let bots = guild.members.filter(m => m.user.bot).length;
        let percent = Math.floor(bots / members * 10000) / 100;
        var message = `:white_check_mark: Guild: \`${guild.name}\`` +
            ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
        bu.send(`205153826162868225`, message);
        // if (bot.guilds.size % 100 == 0) {
        //     bu.send(`205153826162868225`, `🎉 I'm now ` +
        //         `in ${bot.guilds.size} guilds! 🎉`);
        // }
        // if (bot.guilds.size % 1000 == 0) {
        //     bu.send(`229135592720433152`, `🎊🎉🎊🎉 I'm now ` +
        //         `in ${bot.guilds.size} guilds! WHOOOOO! 🎉🎊🎉🎊`);
        // }
        var message2 = `Hi! My name is blargbot, a multifunctional discord bot here to serve you!
- 💻 For command information, please do \`${config.discord.defaultPrefix}help\`!
- 🛠 For Admin commands, please make sure you have a role titled \`Admin\`.
If you are the owner of this server, here are a few things to know.
- 🗨 To enable modlogging, please create a channel for me to log in and do \`${config.discord.defaultPrefix}modlog\`
- ❗ To change my command prefix, please do \`${config.discord.defaultPrefix}setprefix <anything>\`.
- 🗄 To enable chatlogs, please do \`${config.discord.defaultPrefix}settings makelogs true\`.
- ⚙ To receive messages whenever there's an update, do \`${config.discord.defaultPrefix}changelog\` in the desired channel. I need the \`embed links\` permission for this.
- ⚙ Check out my web interface! <https://blargbot.xyz/dashboard/>

❓ If you have any questions, comments, or concerns, please do \`${config.discord.defaultPrefix}feedback <feedback>\`. Thanks!
👍 I hope you enjoy my services! 👍`;
        bu.send(guild.id, message2);
        if (!storedGuild) {
            r.table('guild').insert({
                guildid: guild.id,
                active: true,
                name: guild.name,
                settings: {},
                channels: {},
                commandperms: {},
                ccommands: {},
                modlog: []
            }).run();

        } else {

            r.table('guild').get(guild.id).update({
                active: true
            }).run();
        }
    }
});