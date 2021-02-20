import { EmbedOptions, Message } from 'eris';
import { Cluster } from '../cluster';
import { BaseCommand } from '../core/command';
import { CommandType, defaultStaff, guard, guildSettings, humanize, parse } from '../utils';

export class SettingsCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'settings',
            category: CommandType.ADMIN,
            info: 'Gets or sets the settings for the current guild. Visit https://blargbot.xyz/commands/settings for key documentation.'
        });

        this.setHandlers({
            _run: message => this.all(message),
            'keys': () => this.keys(),
            'set': {
                '{key}': {
                    _run: (message, [, setting]) => this.set(message, setting, ''),
                    '{...value}': (message, [, setting, ...values]) => this.set(message, setting, values.join(' '))
                }
            },
            '{key}': {
                _run: (message, [setting]) => this.set(message, setting, ''),
                '{...value}': (message, [setting, ...values]) => this.set(message, setting, values.join(' '))
            }
        });
    }

    private async all(message: Message): Promise<string | { embed: EmbedOptions }> {
        if (!guard.isGuildMessage(message))
            return 'Settings are only available in a guild';

        const storedGuild = await this.database.guilds.get(message.channel.guild.id);
        if (!storedGuild)
            return 'Your guild is not correctly configured yet! Please try again later';

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
        const mutedRole = settings.mutedrole ? await this.util.getRole(message, settings.mutedrole, { suppress: true }) : null;
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
        return {
            embed: {
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
            }
        };
    }

    private async set(message: Message, setting: string, value: string): Promise<string> {
        if (!guard.isGuildMessage(message))
            return 'Settings are only available in a guild';

        const key = setting.toLowerCase();
        if (!guard.isGuildSetting(key))
            return 'Invalid key!';

        const parsed = await parse.guildSetting(message, this.util, key, value);
        if (!parsed.success)
            return `'${value}' is not a ${guildSettings[key]?.type}`;

        if (!await this.database.guilds.setSetting(message.channel.guild.id, key, parsed.value))
            return 'Failed to set';

        return ':ok_hand:';
    }

    private keys(): string {
        let message = '\nYou can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n';
        for (const key in guildSettings) {
            if (guard.isGuildSetting(key))
                message += ` - **${key.toUpperCase()}** (${guildSettings[key]?.type})\n`;
        }
        return message;
    }
}