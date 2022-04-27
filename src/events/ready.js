/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-10-18 12:10:59
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const moment = require('moment-timezone');

bot.on('ready', async function () {
    bot.sender.send('ready', bot.guilds.map(g => g.id));
    console.init('Ready! Logged in as ' + bot.user.username + '#' + bot.user.discriminator);

    // bot.sender.awaitMessage({ message: 'requestMetrics' }).then(m => {
    //     let registry = JSON.parse(m.metric);
    //     if (registry !== null) {
    //         for (let i = 0; i < registry.length; i++)
    //             if (['bot_guild_gauge', 'bot_user_gauge'].includes(registry[i].name))
    //                 registry[i].values = [];
    //         bu.Metrics.registryCache = [registry];
    //     }
    // });

    let g;
    if (g = bot.guilds.get('194232473931087872')) {
        await bu.ensureMembers(g);
        let police = g.members.filter(m => m.roles.includes('280159905825161216')).map(m => m.id);
        await r.table('vars').get('police').replace({
            value: police, varname: 'police'
        });
        let support = g.members.filter(m => m.roles.includes('263066486636019712')).map(m => m.id);
        await r.table('vars').get('support').replace({
            value: support, varname: 'support'
        });
    }

    if (process.env.CLUSTER_ID == 0) {
        let restart = await r.table('vars').get('restart').run();
        if (restart && restart.varvalue) {
            bu.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + bu.createTimeDiffString(moment(), moment(restart.varvalue.time)) + '.');
            r.table('vars').get('restart').delete().run();
        }
    }

    bu.Metrics.guildGauge.set(bot.guilds.size);

    let guilds = (await r.table('guild').withFields('guildid').run()).map(g => g.guildid);
    //console.dir(guilds);
    bot.guilds.forEach(async function (g) {
        if (guilds.indexOf(g.id) == -1) {
            let guild = bot.guilds.get(g.id);

            console.log('Inserting a missing guild ' + g.id);
            await r.table('guild').insert({
                guildid: g.id,
                active: true,
                name: g.name,
                settings: {},
                channels: {},
                commandperms: {},
                ccommands: {},
                modlog: []
            }).run();
        }
        // bu.guildCache[g.id] = await r.table('guild').get(g.id);
    });

    // gameId = bu.getRandomInt(0, 4);
    // if (config.general.isbeta)
    //     bu.avatarId = 4;
    // else
    //     bu.avatarId = 0;
    // switchGame();
    bu.postStats();
    initEvents();

    let blacklist = await r.table('vars').get('guildBlacklist');

    for (const g of Object.keys(blacklist.values)) {
        if (blacklist.values[g] && bot.guilds.get(g)) {
            let guild = bot.guilds.get(g);
            try {
                let owner = guild.members.get(guild.ownerID).user;
                let pc = await owner.getDMChannel();

                await pc.createMessage(`Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
            } catch (err) { }
            return await guild.leave();
        }
    }
});

let obtainEventTimer;
let processEventTimer;

async function initEvents() {
    console.init('Starting event interval!');
    if (obtainEventTimer) clearInterval(obtainEventTimer);
    obtainEventTimer = setInterval(function () {
        bu.events.obtain();
    }, 5 * 60 * 1000);

    if (processEventTimer) clearInterval(processEventTimer);
    processEventTimer = setInterval(function () {
        bu.events.process();
    }, 10 * 1000);

    await bu.events.obtain();
    await bu.events.process();
}
