var e = module.exports = {};





e.init = () => {
    
    

    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'settings [help|set <key>]';
e.info = 'Gets or sets the settings for the current guild.';
e.longinfo = '<p>Gets or sets the settigns for the current guild.</p>';

e.execute = async function(msg, words) {
    if (words.length == 1) {
        //do settings shit
        let storedGuild = await bu.r.table('guild').get(msg.channel.guild.id).run();
        let settings = storedGuild.settings;
        let channels = storedGuild.channels;

        var nsfw = [];
        var blacklisted = [];
        var i;
        for (let channel in channels) {
            if (channels[channel].nsfw) nsfw.push(channel);
            if (channels[channel].blacklisted) blacklisted.push(channel);
        }
        var prefix = settings.prefix
            ? settings.prefix : 'Not Set';
        var nsfwMessage = 'None Set';
        if (nsfw.length > 0) {
            nsfwMessage = '';
            for (i = 0; i < nsfw.length; i++) {
                let channel = bot.getChannel(nsfw[i]);
                if (channel)
                    nsfwMessage += `${channel.name} (${nsfw[i]})\n                - `;
            }
            nsfwMessage = nsfwMessage.substring(0, nsfwMessage.length - 19);
        }
        var blacklistMessage = 'None Set';
        if (blacklisted.length > 0) {
            blacklistMessage = '';
            for (i = 0; i < blacklisted.length; i++) {
                let channel = bot.getChannel(blacklisted[i]);
                if (channel)
                    blacklistMessage += `${channel.name} (${blacklisted[i]}\n                - `;
            }
            blacklistMessage = blacklistMessage.substring(0, blacklistMessage.length - 19);
        }
        var greeting = settings.greeting
            ? settings.greeting : 'Not Set';
        var farewell = settings.farewell
            ? settings.farewell : 'Not Set';
        var modlogChannel;
        if (settings.modlog) {
            let channel = bot.getChannel(settings.modlog);
            if (channel)
                modlogChannel = `${channel.name} (${settings.modlog})`;
            else
                modlogChannel = `Channel Not Found (${settings.modlog})`;
        } else {
            modlogChannel = 'Not Set';
        }
        var deleteNotif = settings.deletenotif != 0 ? true : false;
        var cahNsfw = settings.cahnsfw && settings.cahnsfw != 0 ? true : false;
        var mutedRole = settings.mutedrole ? settings.mutedrole : 'Not Set';
        var tableFlip = settings.tableflip && settings.tableflip != 0 ? true : false;
        var parsedAntiMention;
        if (settings.antimention) {
            parsedAntiMention = parseInt(settings.antimention);
            if (parsedAntiMention == 0 || isNaN(parsedAntiMention)) {
                parsedAntiMention = 'Disabled';
            }
        } else {
            parsedAntiMention = 'Disabled';
        }
        var antiMention = parsedAntiMention;
        let permOverride = settings.permoverride && settings.permoverride != 0 ? true : false;
        let dmHelp = settings.dmhelp && settings.dmhelp != 0 ? true : false;

        let staffPerms = settings.staffperms || bu.defaultStaff;
        var message = `\`\`\`prolog
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
   Anti-Mention : ${antiMention}
        DM Help : ${dmHelp}
  Perm Override : ${permOverride}
    Staff Perms : ${staffPerms}
\`\`\``;
        bu.send(msg.channel.id, message);
    } else {
        words.shift();
        var key;
        switch (words[0].toLowerCase()) {
            case 'set':
                words.shift();
                if (words.length > 0) {
                    key = words.shift();
                    let value = words.join(' ');
                    if (settings[key]) {
                        await bu.guildSettings.set(msg.channel.guild.id, key, value);
                        bu.send(msg.channel.id, ':ok_hand:');
                    } else {
                        bu.send(msg.channel.id, 'Invalid key!');
                    }
                }
                break;
            case 'help':
                let message = '\nYou can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n';
                for (key in settings) {
                    message += '**__' + key.toUpperCase() + '__**' + ' - ' + settings[key] + '\n';
                }
                bu.send(msg.channel.id, message);
                break;
            default:
                if (words.length > 0) {
                    key = words.shift();
                    let value = words.join(' ');
                    if (settings[key]) {
                        await bu.guildSettings.set(msg.channel.guild.id, key, value);
                        bu.send(msg.channel.id, ':ok_hand:');
                    } else {
                        bu.send(msg.channel.id, 'Invalid key!');
                    }
                }
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
    tableflip: `whether the bot should respond to tableflips/unflips. Set to '0' to disable.`,
    antimention: `the number of unique mentions required to warrant a ban (for anti-mention spam). Set to '0' to disable. Recommended: 25`,
    dmhelp: `whether or not to dm help messages or output them in channels`,
    permoverride: `whether or not specific permissions override role requirement`,
    staffperms: `the numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <https://discordapi.com/permissions.html> for a permission calculator.`
};