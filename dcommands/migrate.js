var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT;

e.execute = (msg, words, text) => {
    if (msg.author.id == bu.CAT_ID) {
        var gArray = bot.guilds.map(m => m);
        gArray.forEach(g => {
            var mconf = bu.config.discord.servers[g.id],
                guildid = g.id,
                guildname = g.name;
            bu.db.query(`insert into guild (guildid)
             values (?)`,
                [guildid], err => {
                    if (mconf) {
                        if (mconf.commands) {
                            Object.keys(mconf.commands).forEach(c => {
                                bu.db.query(`insert into ccommand (guildid, commandname, content) values (?, ?, ?)`,
                                    [guildid, c, mconf.commands[c]]);
                            });
                        }
                        if (mconf.nsfw) {
                            Object.keys(mconf.nsfw).forEach(c => {
                                bu.db.query(`insert into channel (channelid, guildid, nsfw) values (?, ?, true)`,
                                    [c, guildid]);
                            });
                        }

                        if (mconf.prefix) bu.guildSettings.set(g.id, 'prefix', mconf.prefix);
                        if (mconf.modlog) bu.guildSettings.set(g.id, 'modlog', mconf.modlog);
                        if (mconf.greet) bu.guildSettings.set(g.id, 'greeting', mconf.greet);
                        if (mconf.farewell) bu.guildSettings.set(g.id, 'farewell', mconf.farewell);
                        if (mconf.cahNsfw) bu.guildSettings.set(g.id, 'cahnsfw', mconf.cahNsfw);
                        if (mconf.deleteNotifications) bu.guildSettings.set(g.id, 'deletenotif', mconf.deleteNotifications);
                        if (mconf.musicChannel) bu.guildSettings.set(g.id, 'musicchannel', mconf.musicChannel);
                        if (mconf.mutedrole) bu.guildSettings.set(g.id, 'mutedrole', mconf.mutedrole);
                    }
                });


        });
        bu.sendMessageToDiscord(msg.channel.id, 'Migrating');

    }
};