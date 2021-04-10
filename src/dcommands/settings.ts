import { EmbedOptions, Guild, Message } from 'eris';
import { Cluster } from '../cluster';
import { BaseCommand } from '../core/command';
import { codeBlock, CommandType, defaultStaff, guard, guildSettings, parse } from '../utils';

export class SettingsCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'settings',
            category: CommandType.ADMIN,
            info: `Gets or sets the settings for the current guild. Visit ${cluster.util.websiteLink('/commands/settings')} for key documentation.`,
            definition: {
                subcommands: {
                    'list': {
                        parameters: '',
                        execute: message => this.list(message),
                        description: 'Gets the current settings for this guild'
                    },
                    'keys': {
                        parameters: '',
                        description: 'Lists all the setting keys and their types',
                        execute: () => this.keys()
                    },
                    'set': {
                        parameters: '{key} {value*}',
                        description: 'Sets the given setting key to have a certian value. If `value` is omitted, the setting is reverted to its default value',
                        execute: (message, [setting, value]) => this.set(message, setting, value.join(' '))
                    }
                }
            }
        });
    }

    private async list(message: Message): Promise<string | { embed: EmbedOptions }> {
        if (!guard.isGuildMessage(message))
            return '❌ Settings are only available in a guild';

        const storedGuild = await this.database.guilds.get(message.channel.guild.id);
        if (!storedGuild)
            return '❌ Your guild is not correctly configured yet! Please try again later';

        const settings = storedGuild.settings;
        const guild = message.channel.guild;

        return {
            embed: {
                fields: [
                    {
                        name: 'General',
                        value: settingGroup([
                            ['prefix', Array.isArray(settings.prefix) ? settings.prefix[0] : settings.prefix],
                            ['dmhelp', parse.boolean(settings.dmhelp, false, true)],
                            ['disablenoperms', settings.disablenoperms ?? false],
                            ['social', settings.social ?? false]
                        ])
                    },
                    {
                        name: 'Messages',
                        value: settingGroup([
                            ['greeting', settings.greeting],
                            ['farewell', settings.farewell],
                            ['tableflip', parse.boolean(settings.tableflip, false, true)],
                            ['nocleverbot', settings.nocleverbot ?? false],
                            ['disableeveryone', settings.disableeveryone ?? false]
                        ])
                    },
                    {
                        name: 'Channels',
                        value: settingGroup([
                            ['farewellchan', resolveChannel(guild, settings.farewellchan) ?? 'Default Channel'],
                            ['greetChan', resolveChannel(guild, settings.greetChan) ?? 'Default Channel'],
                            ['modlog', resolveChannel(guild, settings.modlog)]
                        ])
                    },
                    {
                        name: 'Permissions',
                        value: settingGroup([
                            ['permoverride', parse.boolean(settings.permoverride, false, true)],
                            ['staffperms', settings.staffperms ?? defaultStaff],
                            ['kickoverride', settings.kickoverride],
                            ['banoverride', settings.banoverride]
                        ])
                    },
                    {
                        name: 'Warnings',
                        value: settingGroup([
                            ['kickat', settings.kickat],
                            ['banat', settings.banat]
                        ])
                    },
                    {
                        name: 'Moderation',
                        value: settingGroup([
                            ['makelogs', parse.boolean(settings.makelogs, false, true)],
                            ['antimention', settings.antimention],
                            ['mutedrole', resolveRole(guild, settings.mutedrole)],
                            ['deletenotif', parse.boolean(settings.deletenotif, false, true)],
                            ['adminrole', resolveRole(guild, settings.adminrole)]
                        ])
                    }
                ]
            }
        };
    }

    private async set(message: Message, setting: string, value: string): Promise<string> {
        if (!guard.isGuildMessage(message))
            return '❌ Settings are only available in a guild';

        const key = setting.toLowerCase();
        if (!guard.isGuildSetting(key))
            return '❌ Invalid key!';

        const parsed = await parse.guildSetting(message, this.util, key, value);
        if (!parsed.success)
            return `❌ '${value}' is not a ${guildSettings[key]?.type}`;

        if (!await this.database.guilds.setSetting(message.channel.guild.id, key, parsed.value))
            return '❌ Failed to set';

        return `✅ ${guildSettings[key]?.name} is set to ${parsed.display}`;
    }

    private keys(): string {
        const message = [];
        for (const key in guildSettings) {
            if (guard.isGuildSetting(key)) {
                const setting = guildSettings[key];
                if (setting !== undefined) {
                    message.push(` - **${setting.name}:** \`${setting.key.toUpperCase()}\` (${setting.type})`);
                }
            }
        }
        return 'You can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n'
            + message.sort().join('\n');
    }
}

function resolveChannel(guild: Guild, channelId: string | undefined): string | undefined {
    if (channelId === undefined)
        return undefined;
    const channel = guild.channels.get(channelId)
        ?? guild.channels.find(c => c.name.toLowerCase() === channelId.toLowerCase());
    if (!channel)
        return `Unknown channel (${channelId})`;
    return `${channel.name} (${channel.id})`;
}

function resolveRole(guild: Guild, roleId: string | undefined): string | undefined {
    if (roleId === undefined)
        return undefined;
    const role = guild.roles.get(roleId)
        ?? guild.roles.find(r => r.name.toLowerCase() === roleId.toLowerCase());
    if (!role)
        return `Unknown role (${roleId})`;
    return `${role.name} (${role.id})`;
}

function settingGroup(values: Array<[key: string & keyof typeof guildSettings, value: string | undefined | boolean | number]>): string {
    const mapped = values.map<[string, unknown]>(([key, value]) => {
        const setting = guildSettings[key];
        return [
            setting?.name ?? key,
            `${value ?? 'Not set'}`.substring(0, 100)
        ];
    });
    const keyLength = Math.max(...mapped.map(([key]) => key.length));
    const content = mapped.map(v => `${v[0].padStart(keyLength, ' ')} : ${v[1]}`)
        .join('\n');
    return codeBlock(content, '');
}