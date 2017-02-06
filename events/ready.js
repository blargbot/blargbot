bot.on('ready', async function() {
    logger.init('Ready! Logged in as ' + bot.user.username + '#' + bot.user.discriminator);
    let restart = await r.table('vars').get('restart').run();
    if (restart && restart.varvalue) {
        bu.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + bu.createTimeDiffString(dep.moment(), dep.moment(restart.varvalue.time)) + '.');
        r.table('vars').get('restart').delete().run();
    }

    let guilds = (await r.table('guild').withFields('guildid').run()).map(g => g.guildid);
    //console.dir(guilds);
    bot.guilds.forEach(async function(g) {
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
    switchAvatar();
    bu.postStats();
    if (eventTimer == undefined) {
        initEvents();
    }

    if (!bu.ircInitialized) {
        bu.emitter.emit('ircInit');
        bu.ircInitialized = true;
    }
});

/**
 * Switches the avatar
 * @param forced - if true, will not set a timeout (Boolean)
 */
function switchAvatar(forced) {
    bot.editSelf({
        avatar: bu.avatars[bu.avatarId]
    });
    bu.avatarId++;
    if (bu.avatarId == 8)
        bu.avatarId = 0;
    if (!forced)
        setTimeout(function() {
            switchAvatar();
        }, 600000);
}

var gameId;
/**
 * Switches the game the bot is playing
 * @param forced - if true, will not set a timeout (Boolean)
 */
function switchGame(forced) {
    for (const shard of bot.shards) {
        var name = '';
        var oldId = gameId;
        while (oldId == gameId) {
            gameId = bu.getRandomInt(0, 11);
        }
        switch (gameId) {
            case 0:
                name = `with ${bot.users.size} users!`;
                break;
            case 1:
                name = `in ${bot.guilds.size} guilds!`;
                break;
            case 2:
                name = `in ${Object.keys(bot.channelGuildMap).length} channels!`;
                break;
            case 3:
                name = `with tiny bits of string!`;
                break;
            case 4:
                name = `with a laser pointer!`;
                break;
            case 5:
                name = `on version ${bu.VERSION}!`;
                break;
            case 6:
                name = `type 'b!help'!`;
                break;
            case 7:
                name = `with a laser pointer!`;
                break;
            case 8:
                name = `with ${bot.shards.size} shards!`;
                break;
            case 9:
                name = `with a mouse!`;
                break;
            case 10:
                name = `with a ball of yarn!`;
                break;
            case 11:
                name = `in a box!`;
                break;
            case 12:
                name = `on shard ${shard[1].id}!`;
                break;
        }
        shard[1].editStatus(null, {
            name: name
        });
    }
    if (!forced)
        setTimeout(function() {
            switchGame();
        }, 60000);
}

var eventTimer;

function initEvents() {
    logger.init('Starting event interval!');
    eventTimer = setInterval(async function() {
        let events = await r.table('events').between(r.epochTime(0), r.now(), {
            index: 'endtime'
        });
        for (let event of events) {
            let type = event.type;
            bu.commands[type].event(event);
            r.table('events').get(event.id).delete().run();
        }
    }, 10000);
}