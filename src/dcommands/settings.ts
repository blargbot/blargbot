import { Message } from 'eris';
import { Cluster } from '../cluster';
import { BaseDCommand } from '../structures/BaseDCommand';
import { commandTypes, defaultStaff, guard, guildSettings, humanize, parse } from '../utils';

export class SettingsCommand extends BaseDCommand {
    public constructor(cluster: Cluster) {
        super(cluster, 'settings', {
            category: commandTypes.ADMIN,
            usage: 'settings [keys|help|set <key>]',
            info: 'Gets or sets the settings for the current guild. Visit https://blargbot.xyz/commands/settings for key documentation.'
        });
    }

    public async execute(msg: Message, words: string[]): Promise<void> {
        if (!guard.isGuildMessage(msg)) {
            await this.send(msg, 'Settings are only available in a guild');
            return;
        }

        if (words.length == 1) {
            //do settings shit
            const storedGuild = await this.database.guilds.get(msg.channel.guild.id);
            if (!storedGuild) {
                await this.send(msg, 'Your guild is not correctly configured yet! Please try again later');
                return;
            }
            const settings = storedGuild.settings;
            const channels = storedGuild.channels;

            const nsfw = [];
            const blacklisted = [];
            let i: number;
            for (const channel in channels) {
                if (channels[channel]?.nsfw) nsfw.push(channel);
                if (channels[channel]?.blacklisted) blacklisted.push(channel);
            }
            let prefix = settings.prefix ?
                settings.prefix : 'Not Set';
            if (Array.isArray(prefix)) prefix = prefix[0];
            let nsfwMessage = 'None Set';
            if (nsfw.length > 0) {
                nsfwMessage = '';
                for (i = 0; i < nsfw.length; i++) {
                    const channel = this.discord.getChannel(nsfw[i]);
                    if (channel)
                        nsfwMessage += `${humanize.channelName(channel)} (${nsfw[i]})\n                - `;
                }
                nsfwMessage = nsfwMessage.substring(0, nsfwMessage.length - 19);
            }
            let blacklistMessage = 'None Set';
            if (blacklisted.length > 0) {
                blacklistMessage = '';
                for (i = 0; i < blacklisted.length; i++) {
                    const channel = this.discord.getChannel(blacklisted[i]);
                    if (channel)
                        blacklistMessage += `${humanize.channelName(channel)} (${blacklisted[i]})\n                - `;
                }
                blacklistMessage = blacklistMessage.substring(0, blacklistMessage.length - 19);
            }
            let greeting = settings.greeting ?
                settings.greeting : 'Not Set';
            if (greeting.length > 100) greeting = greeting.substring(0, 100) + '...';
            let farewell = settings.farewell ?
                settings.farewell : 'Not Set';
            if (farewell.length > 100) farewell = farewell.substring(0, 100) + '...';
            let modlogChannel: string;
            if (settings.modlog) {
                const channel = this.discord.getChannel(settings.modlog);
                if (channel)
                    modlogChannel = `${humanize.channelName(channel)} (${settings.modlog})`;
                else
                    modlogChannel = `Channel Not Found (${settings.modlog})`;
            } else {
                modlogChannel = 'Not Set';
            }
            const deleteNotif = parse.boolean(settings.deletenotif, false, true);
            // const cahNsfw = settings.cahnsfw && settings.cahnsfw != 0 ? true : false;
            const mutedRole = settings.mutedrole ? await this.util.getRole(msg, settings.mutedrole, { quiet: true, suppress: true }) : null;
            const tableFlip = parse.boolean(settings.tableflip, false, true);
            let parsedAntiMention: string;
            if (settings.antimention) {
                parsedAntiMention = parse.int(settings.antimention).toString();
                if (parsedAntiMention == '0' || parsedAntiMention === 'NaN') {
                    parsedAntiMention = 'Disabled';
                }
            } else {
                parsedAntiMention = 'Disabled';
            }
            const antiMention = parsedAntiMention;
            const permOverride = parse.boolean(settings.permoverride, false, true);
            const dmHelp = parse.boolean(settings.dmhelp, false, true);
            const makeLogs = parse.boolean(settings.makelogs, false, true);


            const staffPerms = settings.staffperms || defaultStaff;
            const kickPerms = settings.kickoverride || 0;
            const banPerms = settings.banoverride || 0;
            const disableEveryone = settings.disableeveryone || false;
            const disableNoPerms = settings.disablenoperms || false;
            const greetChan = settings.greetChan ? this.discord.getChannel(settings.greetChan) ?? undefined : undefined;
            const farewellChan = settings.farewellchan ? this.discord.getChannel(settings.farewellchan) ?? undefined : undefined;
            const cleverbot = settings.nocleverbot || false;
            const kickAt = settings.kickat || 'Disabled';
            const banAt = settings.banat || 'Disabled';
            const social = settings.social || 'Disabled';
            const adminRoleName = settings.adminrole || 'Admin';
            const embed = {
                fields: [
                    {
                        name: 'General',
                        value: `\`\`\`
          Prefix : ${prefix}
         DM Help : ${dmHelp}
Disable No Perms : ${disableNoPerms}
 Social Commands : ${social}
\`\`\``
                    },
                    {
                        name: 'Messages',
                        value: `\`\`\`
         Greeting : ${greeting}
         Farewell : ${farewell}
       Tableflips : ${tableFlip}
        Cleverbot : ${!cleverbot}
Disable @everyone : ${disableEveryone}
\`\`\``
                    },
                    {
                        name: 'Channels',
                        value: `\`\`\`
Farewell Channel : ${farewellChan ? humanize.channelName(farewellChan) : 'Default Channel'}
Greeting Channel : ${greetChan ? humanize.channelName(greetChan) : 'Default Channel'}
   NSFW Channels : ${nsfwMessage}
  Modlog Channel : ${modlogChannel}
     Blacklisted : ${blacklistMessage}
\`\`\``
                    },
                    {
                        name: 'Permissions',
                        value: `\`\`\`
Perm Override : ${permOverride}
  Staff Perms : ${staffPerms}
Kick Override : ${kickPerms}
 Ban Override : ${banPerms}
\`\`\``
                    },
                    {
                        name: 'Warnings',
                        value: `\`\`\`
Kick At : ${kickAt}
 Ban At : ${banAt}
\`\`\``
                    },
                    {
                        name: 'Moderation',
                        value: `\`\`\`
      Chat Logs : ${makeLogs}
   Anti-Mention : ${antiMention}
     Muted Role : ${mutedRole ? `${mutedRole.name} (${mutedRole.id})` : 'Not Set'}
  Track Deletes : ${deleteNotif}
Admin Role Name : ${adminRoleName}
\`\`\``
                    }
                ]
            };

            await this.send(msg, { embed });
        } else {
            words.shift();
            switch (words[0].toLowerCase()) {
                case 'keys':
                    let message = '\nYou can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n';
                    for (const key in guildSettings) {
                        if (guard.isGuildSetting(key))
                            message += ` - **${key.toUpperCase()}** (${guildSettings[key]?.type})\n`;
                    }
                    await this.send(msg, message);
                    break;
                case 'help':
                    await this.send(msg, this.info);
                    break;
                case 'set':
                    words.shift();
                default:
                    if (words.length > 0) {
                        const key = words.shift()?.toLowerCase() ?? '';
                        if (!guard.isGuildSetting(key)) {
                            await this.send(msg, 'Invalid key!');
                            return;
                        }
                        const parsed = await parse.guildSetting(msg, this.util, key, words.join(' '));
                        if (!parsed.success) {
                            const def = guildSettings[key];
                            await this.send(msg, `'${words.join(' ')}' is not a ${def?.type}`);
                            return;
                        }

                        if (!await this.database.guilds.setSetting(msg.channel.guild.id, key, parsed.value)) {
                            await this.send(msg, 'Failed to set');
                            return;
                        }
                        await this.send(msg, ':ok_hand:');
                    }
                    break;
            }
        }
    }
}