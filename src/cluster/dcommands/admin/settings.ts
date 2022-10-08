import { Cluster } from '@blargbot/cluster';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { codeBlock, CommandType, defaultStaff, guard, guildSettings, parse } from '@blargbot/cluster/utils';
import { Guild } from 'eris';

export class SettingsCommand extends GuildCommand {
    public constructor(cluster: Cluster) {
        super({
            name: `settings`,
            category: CommandType.ADMIN,
            description: `Gets or sets the settings for the current guild. Visit ${cluster.util.websiteLink(`/guilds/settings`)} for key documentation.`,
            definitions: [
                {
                    parameters: ``,
                    execute: ctx => this.list(ctx),
                    description: `Gets the current settings for this guild`
                },
                {
                    parameters: `keys`,
                    description: `Lists all the setting keys and their types`,
                    execute: () => this.keys()
                },
                {
                    parameters: `set {key} {~value+?}`,
                    description: `Sets the given setting key to have a certian value. If \`value\` is omitted, the setting is reverted to its default value`,
                    execute: (ctx, [setting, value]) => this.set(ctx, setting.asString, value.asOptionalString)
                }
            ]
        });
    }

    public async list(context: GuildCommandContext): Promise<CommandResult> {
        const storedGuild = await context.database.guilds.get(context.channel.guild.id);
        if (storedGuild === undefined)
            return `❌ Your guild is not correctly configured yet! Please try again later`;

        const settings = storedGuild.settings;
        const guild = context.channel.guild;

        return {
            embeds: [
                {
                    fields: [
                        {
                            name: `General`,
                            value: settingGroup([
                                [`dmhelp`, parse.boolean(settings.dmhelp, false, true)],
                                [`disablenoperms`, settings.disablenoperms ?? false],
                                [`social`, settings.social ?? false]
                            ])
                        },
                        {
                            name: `Messages`,
                            value: settingGroup([
                                [`tableflip`, parse.boolean(settings.tableflip, false, true)],
                                [`nocleverbot`, settings.nocleverbot ?? false],
                                [`disableeveryone`, settings.disableeveryone ?? false]
                            ])
                        },
                        {
                            name: `Channels`,
                            value: settingGroup([
                                [`farewellchan`, resolveChannel(guild, settings.farewellchan) ?? `Default Channel`],
                                [`greetchan`, resolveChannel(guild, settings.greetchan) ?? `Default Channel`],
                                [`modlog`, resolveChannel(guild, settings.modlog)]
                            ])
                        },
                        {
                            name: `Permission`,
                            value: settingGroup([
                                [`staffperms`, settings.staffperms ?? defaultStaff.toString()],
                                [`timeoutoverride`, settings.timeoutoverride],
                                [`kickoverride`, settings.kickoverride],
                                [`banoverride`, settings.banoverride]
                            ])
                        },
                        {
                            name: `Warnings`,
                            value: settingGroup([
                                [`timeoutat`, settings.timeoutat],
                                [`kickat`, settings.kickat],
                                [`banat`, settings.banat],
                                [`actonlimitsonly`, settings.actonlimitsonly]
                            ])
                        },
                        {
                            name: `Moderation`,
                            value: settingGroup([
                                [`makelogs`, parse.boolean(settings.makelogs, false, true)],
                                [`antimention`, settings.antimention],
                                [`mutedrole`, resolveRole(guild, settings.mutedrole)],
                                [`deletenotif`, parse.boolean(settings.deletenotif, false, true)],
                                [`adminrole`, resolveRole(guild, settings.adminrole)]
                            ])
                        }
                    ]
                }
            ]
        };
    }

    public async set(context: GuildCommandContext, setting: string, value: string | undefined): Promise<CommandResult> {
        const key = setting.toLowerCase();
        if (!guard.hasProperty(guildSettings, key))
            return `❌ Invalid key!`;

        const parsed = await parse.guildSetting(context, context.util, key, value);
        if (!parsed.success)
            return `❌ '${value ?? `\u200b`}' is not a ${guildSettings[key].type}`;

        if (!await context.database.guilds.setSetting(context.channel.guild.id, key, parsed.value))
            return `❌ ${value ?? `\u200b`} is already set for ${key}`;

        return `✅ ${guildSettings[key].name} is set to ${parsed.display ?? `nothing`}`;
    }

    public keys(): CommandResult {
        const message = [];
        for (const key in guildSettings) {
            if (guard.hasProperty(guildSettings, key)) {
                const setting = guildSettings[key];
                message.push(` - **${setting.name}:** \`${setting.key.toUpperCase()}\` (${setting.type})`);
            }
        }
        return `You can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n${message.sort().join(`\n`)}`;
    }
}

function resolveChannel(guild: Guild, channelId: string | undefined): string | undefined {
    // TODO channelId can be channel name, id or tag
    if (channelId === undefined)
        return undefined;
    const channel = guild.channels.get(channelId)
        ?? guild.channels.find(c => c.name.toLowerCase() === channelId.toLowerCase());
    if (channel === undefined)
        return `Unknown channel (${channelId})`;
    return `${channel.name} (${channel.id})`;
}

function resolveRole(guild: Guild, roleId: string | undefined): string | undefined {
    // TODO roleId can be role name, id or tag
    if (roleId === undefined)
        return undefined;
    const role = guild.roles.get(roleId)
        ?? guild.roles.find(r => r.name.toLowerCase() === roleId.toLowerCase());
    if (role === undefined)
        return `Unknown role (${roleId})`;
    return `${role.name} (${role.id})`;
}

function settingGroup(values: Array<[key: string & keyof typeof guildSettings, value: string | undefined | boolean | number]>): string {
    const mapped = values.map(([key, value]) => {
        const setting = guildSettings[key];
        return [
            setting.name,
            `${value ?? `Not set`}`.substring(0, 100)
        ] as const;
    });
    const keyLength = Math.max(...mapped.map(([key]) => key.length));
    const content = mapped.map(v => `${v[0].padStart(keyLength, ` `)} : ${v[1]}`)
        .join(`\n`);
    return codeBlock(content);
}
