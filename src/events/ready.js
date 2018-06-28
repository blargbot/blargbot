/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-03 23:01:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const blacklist = require('../../blacklist.json');
const moment = require('moment-timezone');

bot.on('ready', async function () {
    bot.sender.send('ready', bot.guilds.map(g => g.id));
    console.init('Ready! Logged in as ' + bot.user.username + '#' + bot.user.discriminator);

    bot.sender.awaitMessage({ message: 'requestMetrics' }).then(m => {
        let registry = JSON.parse(m.metric);
        if (registry !== null) {
            for (let i = 0; i < registry.length; i++)
                if (['bot_guild_gauge', 'bot_user_gauge'].includes(registry[i].name))
                    registry[i].values = [];
            bu.Metrics.registryCache = [registry];
        }
    });

    let g;
    if (g = bot.guilds.get('194232473931087872')) {
        let police = g.members.filter(m => m.roles.includes('280159905825161216')).map(m => m.id);
        await r.table('vars').get('police').replace({
            value: police, varname: 'police'
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
            let members = guild.memberCount;
            let users = guild.members.filter(m => !m.user.bot).length;
            let bots = guild.members.filter(m => m.user.bot).length;
            let percent = Math.floor(bots / members * 10000) / 100;
            var message = `:ballot_box_with_check: Guild: \`${guild.name}\`` +
                ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            bu.send(`205153826162868225`, message);

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
        bu.guildCache[g.id] = await r.table('guild').get(g.id);
    });

    gameId = bu.getRandomInt(0, 4);
    if (config.general.isbeta)
        bu.avatarId = 4;
    else
        bu.avatarId = 0;
    switchGame();
    if (process.env.CLUSTER_ID == 0)
        switchAvatar();
    bu.postStats();
    if (eventTimer == undefined) {
        initEvents();
    }

    for (const g of blacklist) {
        if (bot.guilds.get(g)) {
            let guild = bot.guilds.get(g);
            let owner = guild.members.get(guild.ownerID).user;
            let pc = await owner.getDMChannel();

            await pc.createMessage(`Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);

            return await guild.leave();
        }
    }
});

/**
 * Switches the avatar
 * @param forced - if true, will not set a timeout (Boolean)
 */
function switchAvatar(forced) {
    if (config.general.isbeta) return;
    bot.editSelf({
        avatar: bu.avatars[bu.avatarId]
    });
    bu.avatarId++;
    if (bu.avatarId == 8)
        bu.avatarId = 0;
    if (!forced)
        setTimeout(function () {
            switchAvatar();
        }, 600000);
}

var gameId;
/**
 * Switches the game the bot is playing
 * @param forced - if true, will not set a timeout (Boolean)
 */
async function switchGame(forced) {
    for (const shard of bot.shards) {
        var name = '', type = 0;
        var oldId = gameId;
        while (oldId == gameId) {
            gameId = bu.getRandomInt(0, 11);
        }
        switch (moment().format('MM-DD')) {
            case '04-16':
                name = 'Happy age++, stupid cat!';
                break;
            case '12-25':
                name = 'Merry Christmas!';
                break;
            case '03-17':
                name = 'Happy St. Patrick\'s day!';
                break;
            case '01-01':
                name = 'Happy New Year\'s!';
                break;
            case '07-01':
                name = 'Happy Canada Day!';
                break;
            case '07-04':
                name = 'Happy Independence Day!';
                break;
            case '10-31':
                name = 'Happy Halloween!';
                break;
            case '03-08':
                name = 'Happy Women\'s Day!';
                break;
            case '11-19':
                name = 'Happy Men\'s Day!';
                break;
            case '09-21':
                name = 'Happy Peace Day!';
                break;
            case '05-01':
                name = 'Happy Labour Day!';
                break;
            case '03-14':
                name = 'Happy Pi Day!';
                break;
            case '04-01':
                name = '👀';
                break;
            case '01-25':
                name = '!yaD etisoppO yppaH';
                break;
            case '05-29':
                name = 'Happy Put-A-Pillow-On-Your-Fridge Day!';
                break;
            case '07-27':
                name = 'Happy Take-Your-Houseplants-For-A-Walk Day!';
                break;
            case '05-04':
                name = 'May the Fourth be with you.';
                break;
            case '12-23':
                name = 'Happy Festivus!';
                break;
            default:
                switch (gameId) {
                    case 0:
                        name = `with ${bot.users.size} users!`;
                        break;
                    case 1:
                        type = 2;
                        name = `${bot.guilds.size} guilds!`;
                        break;
                    case 2:
                        type = 2;
                        name = `${Object.keys(bot.channelGuildMap).length} channels!`;
                        break;
                    case 3:
                        name = `with tiny bits of string!`;
                        break;
                    case 4:
                        name = `on version ${await bu.getVersion()}!`;
                        break;
                    case 5:
                        name = `type 'b!help'!`;
                        break;
                    case 6:
                        type = 3;
                        name = `a laser pointer!`;
                        break;
                    case 7:
                        name = `with a mouse!`;
                        break;
                    case 8:
                        name = `with a ball of yarn!`;
                        break;
                    case 9:
                        name = `in a box!`;
                        break;
                    case 10:
                        type = 3;
                        name = `you on shard ${shard[1].id}!`;
                        break;
                    case 11:
                        type = 2;
                        name = 'the pitter-patter of tiny feet.';
                }
        }

        shard[1].editStatus(null, {
            name, type
        });
    }
    if (!forced)
        setTimeout(function () {
            switchGame();
        }, 60000);
}

var eventTimer;

function initEvents() {
    console.init('Starting event interval!');
    eventTimer = setInterval(async function () {
        let events = await r.table('events').between(r.epochTime(0), r.now(), {
            index: 'endtime'
        });
        for (let event of events) {
            if (event.channel && !bot.getChannel(event.channel)) continue;
            else if (event.guild && !bot.guilds.get(event.guild)) continue;
            else if (!event.channel && !event.guild && event.user && process.env.CLUSTER_ID != 0) continue;
            else if (event.type === 'purgelogs' && process.env.CLUSTER_ID != 0) continue;
            let type = event.type;
            CommandManager.built[type].event(event);
            r.table('events').get(event.id).delete().run();
        }
    }, 10000);
}