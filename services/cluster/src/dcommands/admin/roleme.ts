import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '../../command/index.js';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, guard } from '@blargbot/cluster/utils/index.js';
import { GuildRolemeEntry } from '@blargbot/domain/models/index.js';
import { IFormattable, util } from '@blargbot/formatting';
import Eris from 'eris';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult.js';
import templates from '../../text.js';

const cmd = templates.commands.roleMe;

export class RolemeCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'roleme',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'a', word: 'add', description: cmd.flags.add },
                { flag: 'r', word: 'remove', description: cmd.flags.remove },
                { flag: 'C', word: 'case', description: cmd.flags.case },
                { flag: 'c', word: 'channels', description: cmd.flags.channels }
            ],
            definitions: [
                {
                    parameters: 'add|create {~phrase+}',
                    description: cmd.add.description,
                    execute: (ctx, [phrase], flags) => this.addRoleme(ctx, phrase.asString, {
                        caseSensitive: flags.C !== undefined,
                        addRoles: flags.a?.map(v => v.value),
                        removeRoles: flags.r?.map(v => v.value),
                        channel: flags.c?.map(v => v.value)
                    })
                },
                {
                    parameters: 'remove|delete {rolemeId:integer}',
                    description: cmd.remove.description,
                    execute: (ctx, [id]) => this.deleteRoleme(ctx, id.asInteger)
                },
                {
                    parameters: 'edit {rolemeId:integer} {~newPhrase+?}',
                    description: cmd.edit.description,
                    execute: (ctx, [id, phrase], flags) => this.editRoleme(ctx, id.asInteger, phrase.asOptionalString, {
                        caseSensitive: flags.C !== undefined,
                        addRoles: flags.a?.map(v => v.value),
                        removeRoles: flags.r?.map(v => v.value),
                        channel: flags.c?.map(v => v.value)
                    })
                },
                {
                    parameters: 'setmessage {rolemeId:integer} {~bbtag+?}',
                    description: cmd.setMessage.description,
                    execute: (ctx, [id, bbtag]) => this.setMessage(ctx, id.asInteger, bbtag.asOptionalString)
                },
                {
                    parameters: 'rawmessage {rolemeId:integer} {fileExtension:literal(bbtag|txt)=bbtag}',
                    description: cmd.rawMessage.description,
                    execute: (ctx, [id, fileExtension]) => this.getRawMessage(ctx, id.asInteger, fileExtension.asLiteral)
                },
                {
                    parameters: 'debugmessage {rolemeId:integer}',
                    description: cmd.debugMessage.description,
                    execute: (ctx, [id]) => this.debugMessage(ctx, id.asInteger)
                },
                {
                    parameters: 'setauthorizer {rolemeId:integer}',
                    description: cmd.setAuthorizer.description,
                    execute: (ctx, [id]) => this.setAuthorizer(ctx, id.asInteger)
                },
                {
                    parameters: 'info {rolemeId:integer}',
                    description: cmd.info.description,
                    execute: (ctx, [id]) => this.showInfo(ctx, id.asInteger)
                },
                {
                    parameters: 'list',
                    description: cmd.list.description,
                    execute: (ctx) => this.listRolemes(ctx)
                }
            ]
        });
    }

    public async addRoleme(context: GuildCommandContext, phrase: string, options: RolemeOptions): Promise<CommandResult> {
        const roleme = await this.#buildRoleme(context, {
            message: phrase,
            add: options.addRoles ?? [],
            casesensitive: options.caseSensitive,
            channels: options.channel ?? [],
            remove: options.removeRoles ?? []
        });

        switch (roleme) {
            case 'FAILED': return cmd.add.unexpectedError;
            case 'INVALID_CHANNELS': return cmd.errors.missingChannels;
            case 'INVALID_ROLES': return cmd.errors.missingRoles;
            case 'NO_ROLES': return cmd.errors.noRoles;
            case 'NO_TRIGGER': return cmd.errors.noTrigger;
            case 'TIMED_OUT': return undefined;
        }

        const rolemes = await context.database.guilds.getRolemes(context.channel.guild.id);
        const lastId = Math.max(0, ...Object.keys(rolemes ?? {}).map(r => parseInt(r)));
        const nextId = isNaN(lastId) ? 0 : lastId + 1;
        await context.database.guilds.setRoleme(context.channel.guild.id, nextId, roleme);
        return cmd.add.success({ id: nextId });
    }

    public async editRoleme(context: GuildCommandContext, id: number, phrase: string | undefined, options: RolemeOptions): Promise<CommandResult> {
        const current = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (current === undefined)
            return cmd.errors.missing({ id });

        const roleme = await this.#buildRoleme(context, {
            message: phrase ?? current.message,
            add: options.addRoles ?? current.add,
            casesensitive: phrase === undefined ? current.casesensitive : options.caseSensitive,
            channels: options.channel ?? current.channels,
            remove: options.removeRoles ?? current.remove
        });

        switch (roleme) {
            case 'FAILED': return cmd.edit.unexpectedError;
            case 'INVALID_CHANNELS': return cmd.errors.missingChannels;
            case 'INVALID_ROLES': return cmd.errors.missingRoles;
            case 'NO_ROLES': return cmd.errors.noRoles;
            case 'NO_TRIGGER': return cmd.errors.noTrigger;
            case 'TIMED_OUT': return undefined;
        }

        await context.database.guilds.setRoleme(context.channel.guild.id, id, roleme);
        return cmd.edit.success({ id });
    }

    async #buildRoleme(context: GuildCommandContext, roleme: GuildRolemeEntry): Promise<GuildRolemeEntry | 'TIMED_OUT' | 'NO_ROLES' | 'NO_TRIGGER' | 'FAILED' | 'INVALID_CHANNELS' | 'INVALID_ROLES'> {
        const result: Mutable<GuildRolemeEntry> = { casesensitive: false, channels: [], message: '', add: [], remove: [] };

        if (roleme.message !== '') {
            result.message = roleme.message;
            result.casesensitive = roleme.casesensitive;
        } else {
            const trigger = await context.queryText({ prompt: cmd.common.triggerQuery });

            switch (trigger.state) {
                case 'CANCELLED': return 'NO_TRIGGER';
                case 'SUCCESS': break;
                default: return 'TIMED_OUT';
            }

            const caseSensitive = await context.queryConfirm({
                prompt: cmd.common.caseSensitiveQuery.prompt,
                cancel: {
                    style: Eris.Constants.ButtonStyles.SECONDARY,
                    label: cmd.common.caseSensitiveQuery.cancel
                },
                continue: {
                    style: Eris.Constants.ButtonStyles.SECONDARY,
                    label: cmd.common.caseSensitiveQuery.continue
                }
            });

            if (caseSensitive === undefined)
                return 'TIMED_OUT';

            result.message = trigger.value;
            result.casesensitive = caseSensitive;
        }

        if (roleme.channels.length > 0) {
            const channels = [];
            for (const channelStr of roleme.channels) {
                const channel = await context.queryChannel({ filter: channelStr });
                if (channel.state === 'SUCCESS' && guard.isTextableChannel(channel.value))
                    channels.push(channel.value.id);
            }
            if (channels.length === 0)
                return 'INVALID_CHANNELS';
            result.channels = channels;
        } else if (roleme.add.length === 0 && roleme.remove.length === 0) {
            const channels = await context.queryText({
                prompt: cmd.common.channelsQuery.prompt,
                parse: message => ({ success: true, value: message.channelMentions }),
                cancel: {
                    label: cmd.common.channelsQuery.cancel,
                    style: Eris.Constants.ButtonStyles.PRIMARY
                }
            });

            switch (channels.state) {
                case 'CANCELLED': break;
                case 'SUCCESS':
                    result.channels = channels.value;
                    break;
                default: return 'TIMED_OUT';
            }
        }

        if (roleme.add.length === 0 && roleme.remove.length === 0) {
            const toAdd = await this.#requestRoles(context, 'add');
            if (typeof toAdd === 'string')
                return toAdd;
            result.add = toAdd;

            const toRemove = await this.#requestRoles(context, 'remove');
            if (typeof toRemove === 'string')
                return toRemove;
            result.remove = toRemove;

            if (result.add.length === 0 && result.remove.length === 0)
                return 'NO_ROLES';
        } else {
            const toAdd = [];
            for (const roleStr of result.add) {
                const role = await context.queryRole({ filter: roleStr });
                if (role.state === 'SUCCESS')
                    toAdd.push(role.value.id);
            }
            result.add = toAdd;

            const toRemove = [];
            for (const roleStr of result.remove) {
                const role = await context.queryRole({ filter: roleStr });
                if (role.state === 'SUCCESS')
                    toRemove.push(role.value.id);
            }
            result.remove = toRemove;

            if (result.remove.length === 0 && result.add.length === 0)
                return 'INVALID_ROLES';
        }

        return result;
    }

    public async deleteRoleme(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        await context.database.guilds.setRoleme(context.channel.guild.id, id, undefined);
        return cmd.remove.success({ id });
    }

    public async setMessage(context: GuildCommandContext, id: number, message: string | undefined): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        await context.database.guilds.setRoleme(context.channel.guild.id, id, {
            ...roleme,
            output: message === undefined ? undefined : {
                ...roleme.output ?? {},
                author: context.author.id,
                content: message
            }
        });

        return cmd.setMessage.success({ id });
    }

    public async getRawMessage(context: GuildCommandContext, id: number, fileExtension: string): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        if (roleme.output === undefined)
            return cmd.errors.noMessage({ id });

        return new RawBBTagCommandResult(
            cmd.rawMessage.inline({ id, content: roleme.output.content }),
            cmd.rawMessage.attached({ id }),
            roleme.output.content,
            `interval.${fileExtension}`
        );
    }

    public async debugMessage(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        if (roleme.output === undefined)
            return cmd.errors.noMessage({ id });

        const result = await context.cluster.rolemes.invokeMessage(context.message, roleme);
        await context.send(context.author, bbtag.createDebugOutput(result));
        return cmd.debugMessage.success;
    }

    public async setAuthorizer(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        if (roleme.output === undefined)
            return cmd.errors.noMessage({ id });

        await context.database.guilds.setRoleme(context.channel.guild.id, id, {
            ...roleme,
            output: {
                ...roleme.output,
                authorizer: context.author.id
            }
        });

        return cmd.setAuthorizer.success({ id });
    }

    public async showInfo(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return cmd.errors.missing({ id });

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.info.embed.title({ id }),
                    fields: [
                        {
                            name: cmd.info.embed.field.phrase.name({ caseSensitive: roleme.casesensitive }),
                            value: util.literal(roleme.message),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.rolesAdded.name,
                            value: cmd.info.embed.field.rolesAdded.value({ roleIds: roleme.add }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.rolesRemoved.name,
                            value: cmd.info.embed.field.rolesRemoved.value({ roleIds: roleme.remove }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.channels.name,
                            value: cmd.info.embed.field.channels.value({ channelIds: roleme.channels }),
                            inline: true
                        },
                        ...roleme.output === undefined ? [] : [
                            {
                                name: cmd.info.embed.field.message.name,
                                value: cmd.info.embed.field.message.value({
                                    authorId: roleme.output.author ?? '????',
                                    authorizerId: roleme.output.authorizer ?? roleme.output.author ?? '????'
                                }),
                                inline: true
                            }
                        ]
                    ]
                }
            ]
        };
    }

    public async listRolemes(context: GuildCommandContext): Promise<CommandResult> {
        const rolemes = Object.entries(await context.database.guilds.getRolemes(context.channel.guild.id) ?? {})
            .filter((e): e is [string, GuildRolemeEntry] => e[1] !== undefined);

        if (rolemes.length === 0)
            return cmd.list.none;

        const groups = new Map<string | undefined, { name: IFormattable<string>; entries: Array<IFormattable<string>>; }>();

        for (const [id, roleme] of rolemes) {
            const channels = roleme.channels.length === 0 ? [undefined] : roleme.channels;
            const value = cmd.list.embed.description.roleme({ id: Number(id), message: roleme.message });
            for (const channelId of channels) {
                let group = groups.get(channelId);
                if (group === undefined) {
                    groups.set(channelId, group = {
                        name: cmd.list.embed.description.channel({ channelId }),
                        entries: []
                    });
                }
                group.entries.push(value);
            }
        }

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description.layout({ groups: groups.values() })
                }
            ]
        };
    }

    async #requestRoles(context: GuildCommandContext, mode: 'add' | 'remove'): Promise<string[] | 'TIMED_OUT' | 'FAILED'> {
        const result = await context.queryText<string[]>({
            prompt: cmd.common.rolesQuery.prompt[mode],
            parse: async message => {
                const roles = [];
                for (const line of message.content.split('\n')) {
                    const role = await context.queryRole({ filter: line });
                    if (role.state === 'SUCCESS')
                        roles.push(role.value.id);
                }

                if (roles.length > 0)
                    return { success: true, value: roles } as const;
                return { success: false, error: { content: cmd.common.rolesQuery.fail } } as const;
            },
            cancel: {
                label: cmd.common.rolesQuery.cancel,
                style: Eris.Constants.ButtonStyles.PRIMARY
            }
        });

        switch (result.state) {
            case 'CANCELLED': return [];
            case 'SUCCESS': return result.value;
            default: return result.state;
        }
    }
}

interface RolemeOptions {
    caseSensitive: boolean;
    addRoles?: string[];
    removeRoles?: string[];
    channel?: string[];
}
