const BaseCommand = require('../structures/BaseCommand');
const { commandTypes, defaultStaff } = require('../newbu');

bu.settings = {
    makelogs: {
        name: 'Make Chatlogs',
        desc: `Whether to record chat logs or not.`,
        type: 'bool'
    },
    cahnsfw: {
        name: 'Is CAH NSFW',
        desc: `Whether 'cah' can only be done in nsfw channels or not.`,
        type: 'bool'
    },
    deletenotif: {
        name: 'Delete Notifications',
        desc: `If enabled, notifies you if a user deleted their command.`,
        type: 'bool'
    },
    greeting: {
        name: 'Greeting Message',
        desc: `What to say to new users when they join. You can also use the <code>greet</code> command`,
        type: 'string'
    },
    farewell: {
        name: 'Farewell Message',
        desc: `What to say when a user leaves. You can also use the <code>farewell</code> command`,
        type: 'string'
    },
    modlog: {
        name: 'Modlog Channel',
        desc: `The id of the modlog channel. You can also use the <code>modlog</code> command`,
        type: 'string'
    },
    mutedrole: {
        name: 'Muted Role',
        desc: `The id of the muted role.`,
        type: 'string'
    },
    tableflip: {
        name: 'Tableflips',
        desc: `Whether the bot should respond to tableflips/unflips.`,
        type: 'bool'
    },
    antimention: {
        name: 'Anti-Mention',
        desc: `The number of unique mentions required to warrant a ban (for anti-mention spam). Set to '0' to disable. Recommended: 25`,
        type: 'int'
    },
    dmhelp: {
        name: 'DM Help',
        desc: `Whether or not to dm help messages or output them in channels`,
        type: 'bool'
    },
    permoverride: {
        name: 'Permission Override',
        desc: `Whether or not specific permissions override role requirement`,
        type: 'bool'
    },
    staffperms: {
        name: 'Staff Permissions',
        desc: `The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.`,
        type: 'int'
    },
    kickoverride: {
        name: 'Kick Override',
        desc: `Same as staffperms, but allows users to use the kick command regardless of permissions`,
        type: 'int'
    },
    banoverride: {
        name: 'Ban Override',
        desc: `Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions`,
        type: 'int'
    },
    banat: {
        name: 'Ban At',
        desc: 'The number of warnings before a ban. Set to 0 or below to disable.',
        type: 'int'
    },
    kickat: {
        name: 'Kick At',
        desc: 'The number of warnings before a kick. Set to 0 or below to disable.',
        type: 'int'
    },
    adminrole: {
        name: 'Admin Role Name',
        desc: 'The name of the Admin role.',
        type: 'string'
    },
    nocleverbot: {
        name: 'No Cleverbot',
        desc: 'Disables cleverbot functionality',
        type: 'bool'
    },
    disableeveryone: {
        name: 'Disable Everyone Pings',
        desc: 'Disables everyone pings in custom commands.',
        type: 'bool'
    },
    disablenoperms: {
        name: 'Disable No Perms',
        desc: 'Disables the \'You need the role to use this command\' message.',
        type: 'bool'
    },
    social: {
        name: 'Enable Social Commands',
        desc: 'Enables social commands.',
        type: 'bool'
    }
};


class SettingsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'settings',
            category: commandTypes.ADMIN,
            usage: 'settings [keys|help|set <key>]',
            info: 'Gets or sets the settings for the current guild. Visit https://blargbot.xyz/commands/settings for key documentation.'
        });
    }

    async execute(msg, words, text) {
        if (words.length == 1) {
            //do settings shit
            let storedGuild = await bu.getGuild(msg.guild.id);
            let settings = storedGuild.settings;
            let channels = storedGuild.channels;

            var nsfw = [];
            var blacklisted = [];
            var i;
            for (let channel in channels) {
                if (channels[channel].nsfw) nsfw.push(channel);
                if (channels[channel].blacklisted) blacklisted.push(channel);
            }
            var prefix = settings.prefix ?
                settings.prefix : 'Not Set';
            if (Array.isArray(prefix)) prefix = prefix[0];
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
                        blacklistMessage += `${channel.name} (${blacklisted[i]})\n                - `;
                }
                blacklistMessage = blacklistMessage.substring(0, blacklistMessage.length - 19);
            }
            var greeting = settings.greeting ?
                settings.greeting : 'Not Set';
            if (greeting.length > 100) greeting = greeting.substring(0, 100) + '...';
            var farewell = settings.farewell ?
                settings.farewell : 'Not Set';
            if (farewell.length > 100) farewell = farewell.substring(0, 100) + '...';
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
            let makeLogs = settings.makelogs && settings.makelogs != 0 ? true : false;


            let staffPerms = settings.staffperms || defaultStaff;
            let kickPerms = settings.kickoverride || 0;
            let banPerms = settings.banoverride || 0;
            let disableEveryone = settings.disableeveryone || false;
            let disableNoPerms = settings.disablenoperms || false;
            let greetChan = settings.greetchan ? bot.getChannel(settings.greetchan) : 'Default';
            if (greetChan && greetChan != 'Default') greetChan = greetChan.name;
            else greetChan = 'Default Channel';
            let farewellChan = settings.farewellchan ? bot.getChannel(settings.farewellchan) : 'Default';
            if (farewellChan && farewellChan != 'Default') farewellChan = farewellChan.name;
            else farewellChan = 'Default Channel';
            let cleverbot = settings.nocleverbot || false;
            let kickAt = settings.kickat || 'Disabled';
            let banAt = settings.banat || 'Disabled';
            let social = settings.social || 'Disabled';
            let adminRoleName = settings.adminrole || 'Admin';
            let embed = {
                fields: [
                    {
                        name: 'General',
                        value: `\`\`\`
          Prefix : ${prefix}
     CAH is NSFW : ${cahNsfw}
         DM Help : ${dmHelp}
Disable No Perms : ${disableNoPerms}
 Social Commands : ${social}
\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Messages',
                        value: `\`\`\`
         Greeting : ${greeting}
         Farewell : ${farewell}
       Tableflips : ${tableFlip}
        Cleverbot : ${!cleverbot}
Disable @everyone : ${disableEveryone}
\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Channels',
                        value: `\`\`\`
Farewell Channel : ${farewellChan}
Greeting Channel : ${greetChan}
   NSFW Channels : ${nsfwMessage}
  Modlog Channel : ${modlogChannel}
     Blacklisted : ${blacklistMessage}
\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Permissions',
                        value: `\`\`\`
Perm Override : ${permOverride}
  Staff Perms : ${staffPerms}
Kick Override : ${kickPerms}
 Ban Override : ${banPerms}
\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Warnings',
                        value: `\`\`\`
Kick At : ${kickAt}
 Ban At : ${banAt}
\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Moderation',
                        value: `\`\`\`
      Chat Logs : ${makeLogs}
   Anti-Mention : ${antiMention}
     Muted Role : ${mutedRole}
  Track Deletes : ${deleteNotif}
Admin Role Name : ${adminRoleName}
\`\`\``,
                        inline: true
                    }
                ]
            };

            bu.send(msg, { embed });
        } else {
            words.shift();
            var key;
            switch (words[0].toLowerCase()) {
                case 'keys':
                    let message = '\nYou can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n';
                    for (key in bu.settings) {
                        message += ' - **' + key.toUpperCase() + '** (' + bu.settings[key].type + ')\n';
                    }
                    bu.send(msg, message);
                    break;
                case 'help':
                    bu.send(msg, this.info);
                    break;
                case 'set':
                    words.shift();
                default:
                    if (words.length > 0) {
                        key = words.shift().toLowerCase();
                        let value = words.join(' ');
                        if (bu.settings[key]) {
                            let res = await bu.guildSettings.set(msg.channel.guild.id, key, value, bu.settings[key].type);
                            if (res == true)
                                bu.send(msg, ':ok_hand:');
                            else {
                                bu.send(msg, `Failed to set: ${res}`);
                            };
                        } else {
                            bu.send(msg, 'Invalid key!');
                        }
                    }
                    break;
            }
        }
    }
}

module.exports = SettingsCommand;
