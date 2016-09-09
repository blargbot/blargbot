var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'settings [help|set <key>]';
e.info = 'Gets or sets the settings for the current guild.';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words) => {
    if (words.length == 1) {
        //do settings shit
        bu.db.query(`select name, value from guildsetting where guildid=?`, [msg.channel.guild.id], (err, rows) => {
            bu.db.query(`select channelid, nsfw, blacklisted from channel where guildid=?`, [msg.channel.guild.id], (err, rows2) => {
                var nsfw = [];
                var blacklisted = [];
                var i;
                for (i = 0; i < rows2.length; i++) {
                    if (rows2[i].nsfw) {
                        nsfw.push(rows2[i].channelid);
                    }
                    if (rows2[i].blacklisted) {
                        blacklisted.push(rows2[i].channelid);
                    }
                }
                var settings = {};
                for (i = 0; i < rows.length; i++) {
                    settings[rows[i].name] = rows[i].value;
                }

                var prefix = settings.prefix
                    ? settings.prefix : 'no custom prefix set';
                var nsfwMessage = 'none set';
                if (nsfw.length > 0) {
                    nsfwMessage = '';
                    for (i = 0; i < nsfw.length; i++) {
                        nsfwMessage += bot.getChannel(nsfw[i]).name + '\n                - ';
                    }
                    nsfwMessage = nsfwMessage.substring(0, nsfwMessage.length - 19);
                }
                var blacklistMessage = 'none set';
                if (blacklisted.length > 0) {
                    blacklistMessage = '';
                    for (i = 0; i < blacklisted.length; i++) {
                        blacklistMessage += bot.getChannel(blacklisted[i]).name + '\n                - ';
                    }
                    blacklistMessage = blacklistMessage.substring(0, blacklistMessage.length - 19);
                }
                var greeting = settings.greeting
                    ? settings.greeting : 'not set';
                var farewell = settings.farewell
                    ? settings.farewell : 'not set';
                var modlogChannel = settings.modlog
                    ? bot.getChannel(settings.modlog).name : 'not set';
                var deleteNotif = settings.deletenotif != 0 ? true : false;
                var cahNsfw = settings.cahnsfw && settings.cahnsfw != 0 ? true : false;
                var mutedRole = settings.mutedrole ? settings.mutedrole : 'not set';
                var tableFlip = settings.tableflip && settings.tableflip != 0 ? true : false;
                var message = `\`\`\`xl
Settings For ${msg.channel.guild.name}
         Prefix : ${prefix}
  NSFW Channels : ${nsfwMessage}
    Blacklisted : ${blacklistMessage}  
       Greeting : ${greeting}
       Farewell : ${farewell}
 Modlog Channel : ${modlogChannel}
     Muted Role : ${mutedRole}
  Track Deletes : ${deleteNotif}
    CAH is NSFW : ${cahNsfw}
     Tableflips : ${tableFlip}
\`\`\``;
                bu.sendMessageToDiscord(msg.channel.id, message);
            });
        });
    } else {
        words.shift();
        var key;
        switch (words.shift().toLowerCase()) {
            case 'set':
                if (words.length > 0) {
                    key = words.shift();
                    var value = words.join(' ');
                    if (settings[key]) {
                        bu.guildSettings.set(msg.channel.guild.id, key, value).then(() => {
                            bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
                        });
                    } else {
                        bu.sendMessageToDiscord(msg.channel.id, 'Invalid key!');
                    }
                }
                break;
            case 'help':
                var message = '```xl\nYou can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n';
                for (key in settings) {
                    message += key.toUpperCase() + ' - ' + settings[key] + '\n';
                }
                message += '```';
                bu.sendMessageToDiscord(msg.channel.id, message);
                break;
        }
    }
};

var settings = {
    cahnsfw: `whether 'cah' can only be done in nsfw channels or not. Set to '0' to disable.`,
    deletenotif: `if enabled, notifies you if a user deleted their command. Set to '0' to disable.`,
    greeting: `what to say to new users when they join. You can also use the \`greet\` command`,
    farewell: `what to say when a user leaves. You can also use the \`farewell\` command`,
    prefix: `the custom command prefix. You can also use the \`setprefix\` command`,
    modlog: `the id of the modlog channel. You can also use the \`modlog\` command`,
    mutedrole: `the id of the muted role.`,
    tableflip: `whether the bot should respond to tableflips/unflips. Set to '0' to disable.`
};