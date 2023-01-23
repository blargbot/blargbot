import type { Cluster } from '@blargbot/cluster';
import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { codeBlock, CommandType, defaultStaff, guard, guildSettings, parse } from '@blargbot/cluster/utils/index.js';
import type { IFormattable, ITranslationSource } from '@blargbot/formatting';
import { format, FormatString } from '@blargbot/formatting';
import { hasProperty } from '@blargbot/guards';
import type * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.settings;

export class SettingsCommand extends GuildCommand {
    public constructor(cluster: Cluster) {
        super({
            name: 'settings',
            category: CommandType.ADMIN,
            description: cmd.description({ website: cluster.util.websiteLink('/guilds/settings') }),
            definitions: [
                {
                    parameters: '',
                    execute: ctx => this.list(ctx),
                    description: cmd.list.description
                },
                {
                    parameters: 'keys',
                    description: cmd.keys.description,
                    execute: () => this.keys()
                },
                {
                    parameters: 'languages',
                    description: cmd.languages.description,
                    execute: ctx => this.languages(ctx)
                },
                {
                    parameters: 'set {key} {~value+?}',
                    description: cmd.set.description,
                    execute: (ctx, [setting, value]) => this.set(ctx, setting.asString, value.asOptionalString)
                }
            ]
        });
    }

    public async list(context: GuildCommandContext): Promise<CommandResult> {
        const storedGuild = await context.database.guilds.get(context.channel.guild.id);
        if (storedGuild === undefined)
            return cmd.list.notConfigured;

        const settings = storedGuild.settings;
        const guild = context.channel.guild;

        return {
            embeds: [
                {
                    fields: [
                        {
                            name: cmd.list.groups.general,
                            value: settingGroup([
                                ['dmhelp', parse.boolean(settings.dmhelp, false, true)],
                                ['disablenoperms', settings.disablenoperms ?? false],
                                ['social', settings.social ?? false]
                            ])
                        },
                        {
                            name: cmd.list.groups.messages,
                            value: settingGroup([
                                ['tableflip', parse.boolean(settings.tableflip, false, true)],
                                ['nocleverbot', settings.nocleverbot ?? false],
                                ['disableeveryone', settings.disableeveryone ?? false]
                            ])
                        },
                        {
                            name: cmd.list.groups.channels,
                            value: settingGroup([
                                ['farewellchan', resolveChannel(guild, settings.farewellchan) ?? cmd.list.channelValue.none],
                                ['greetchan', resolveChannel(guild, settings.greetchan) ?? cmd.list.channelValue.none],
                                ['modlog', resolveChannel(guild, settings.modlog)],
                                ['language', resolveLanguage(settings.language, context.util.translator)]
                            ])
                        },
                        {
                            name: cmd.list.groups.permission,
                            value: settingGroup([
                                ['staffperms', settings.staffperms ?? defaultStaff.toString()],
                                ['timeoutoverride', settings.timeoutoverride],
                                ['kickoverride', settings.kickoverride],
                                ['banoverride', settings.banoverride]
                            ])
                        },
                        {
                            name: cmd.list.groups.warnings,
                            value: settingGroup([
                                ['timeoutat', settings.timeoutat],
                                ['kickat', settings.kickat],
                                ['banat', settings.banat],
                                ['actonlimitsonly', settings.actonlimitsonly]
                            ])
                        },
                        {
                            name: cmd.list.groups.moderation,
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
            ]
        };
    }

    public async set(context: GuildCommandContext, setting: string, value: string | undefined): Promise<CommandResult> {
        const key = setting.toLowerCase();
        if (!hasProperty(guildSettings, key))
            return cmd.set.keyInvalid;

        const parsed = await parse.guildSetting(context, context.util, key, value);
        if (!parsed.success)
            return cmd.set.valueInvalid({ value: value ?? '', type: cmd.types[guildSettings[key].type] });

        if (!await context.database.guilds.setSetting(context.channel.guild.id, key, parsed.value))
            return cmd.set.alreadySet({ value: value ?? '', key });

        return cmd.set.success({ key, value: parsed.display });
    }

    public keys(): CommandResult {
        const settings = Object.entries(guildSettings).map(([key, setting]) => ({
            key,
            name: setting.name,
            type: cmd.types[setting.type]
        }));
        return cmd.keys.success({ settings });
    }

    public languages(context: GuildCommandContext): CommandResult {
        const defined = [...FormatString.list()].map(s => s.id);
        const locales = [{ name: 'English', key: 'en', completion: 1 }];
        for (const [locale, details] of context.util.translator.languages) {
            let total = 0;
            for (const key of defined)
                if (details.keys.has(key))
                    total++;
            locales.push({ name: details.name, key: locale, completion: total / defined.length });
        }
        return cmd.languages.success({ locales: locales.sort((a, b) => b.completion - a.completion) });
    }
}

function resolveChannel(guild: Eris.Guild, channelId: string | undefined): IFormattable<string> | undefined {
    // TODO channelId can be channel name, id or tag
    if (channelId === undefined)
        return undefined;
    const channel = guild.channels.get(channelId)
        ?? guild.channels.find(c => c.name.toLowerCase() === channelId.toLowerCase());
    return channel === undefined || !guard.isGuildChannel(channel)
        ? cmd.list.channelValue.unknown({ channelId })
        : cmd.list.channelValue.default({ channel });
}

function resolveRole(guild: Eris.Guild, roleId: string | undefined): IFormattable<string> | undefined {
    // TODO roleId can be role name, id or tag
    if (roleId === undefined)
        return undefined;
    const role = guild.roles.get(roleId)
        ?? guild.roles.find(r => r.name.toLowerCase() === roleId.toLowerCase());
    return role === undefined
        ? cmd.list.roleValue.unknown({ roleId })
        : cmd.list.roleValue.default({ role });
}

function settingGroup(values: Array<[key: string & keyof typeof guildSettings, value: string | IFormattable<string> | undefined | boolean | number]>): IFormattable<string> {
    return {
        [format](formatter) {
            const mapped = values.map(([key, value = cmd.list.notSet]) => {
                const setting = guildSettings[key];
                const strValue = typeof value === 'object' ? value[format](formatter) : `${value}`;
                return [setting.name[format](formatter), strValue.slice(0, 100)] as const;
            });
            const keyLength = Math.max(...mapped.map(([key]) => key.length));
            const content = mapped.map(v => `${v[0].padStart(keyLength, ' ')} : ${v[1]}`)
                .join('\n');
            return codeBlock(content);
        }
    };
}

function resolveLanguage(language: string | undefined, translator: ITranslationSource): IFormattable<string> | undefined {
    if (language === undefined)
        return undefined;

    const details = translator.languages.get(language)
        ?? translator.languages.get(language = 'en');
    if (details === undefined)
        return cmd.list.localeValue({ name: 'English', completion: 1 });

    let count = 0;
    let provided = 0;
    for (const key of FormatString.list()) {
        count++;
        if (details.keys.has(key.id))
            provided++;
    }

    return cmd.list.localeValue({ name: details.name, completion: provided / count });
}
