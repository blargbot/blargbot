import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, ModerationType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { IFormattable } from '@blargbot/domain/messages/types';
import { GuildCensor, GuildTriggerTag } from '@blargbot/domain/models';
import { KnownChannel, Role, User } from 'eris';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import templates, { literal } from '../../text';

const cmd = templates.commands.censor;

export class CensorCommand extends GuildCommand {
    public constructor() {
        super({
            name: `censor`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `R`, word: `regex`, description: cmd.flags.regex },
                { flag: `D`, word: `decancer`, description: cmd.flags.decancer },
                { flag: `w`, word: `weight`, description: cmd.flags.weight },
                { flag: `r`, word: `reason`, description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: `add|create {~phrase+}`,
                    description: cmd.add.description,
                    execute: (ctx, [phrase], flags) => this.createCensor(ctx, phrase.asString, {
                        isRegex: flags.R !== undefined,
                        decancer: flags.D !== undefined,
                        weight: flags.w?.merge().value,
                        reason: flags.r?.merge().value
                    })
                },
                {
                    parameters: `edit {id:integer} {~phrase+?}`,
                    description: cmd.edit.description,
                    execute: (ctx, [id, phrase], flags) => this.updateCensor(ctx, id.asInteger, phrase.asOptionalString, {
                        isRegex: flags.R !== undefined,
                        decancer: flags.D !== undefined,
                        weight: flags.w?.merge().value,
                        reason: flags.r?.merge().value
                    })
                },
                {
                    parameters: `delete|remove {id:integer}`,
                    description: cmd.delete.description,
                    execute: (ctx, [id]) => this.deleteCensor(ctx, id.asInteger)
                },
                {
                    parameters: `exception {action:literal(add|remove)}`,
                    subcommands: [
                        {
                            parameters: `user {user:user+}`,
                            description: cmd.exception.user.description,
                            execute: (ctx, [action, user]) => this.ignoreUser(ctx, user.asUser, action.asLiteral === `add`)
                        },
                        {
                            parameters: `role {role:role+}`,
                            description: cmd.exception.role.description,
                            execute: (ctx, [action, role]) => this.ignoreRole(ctx, role.asRole, action.asLiteral === `add`)
                        },
                        {
                            parameters: `channel {channel:channel+}`,
                            description: cmd.exception.channel.description,
                            execute: (ctx, [action, channel]) => this.ignoreChannel(ctx, channel.asChannel, action.asLiteral === `add`)
                        }
                    ]
                },
                {
                    parameters: `setmessage {id:integer?} {type:literal(delete|timeout|kick|ban)} {~code+?}`,
                    description: cmd.setMessage.description,
                    execute: (ctx, [id, type, code]) => this.setMessage(ctx, id.asOptionalInteger, type.asLiteral, code.asOptionalString)
                },
                {
                    parameters: `setauthorizer {id:integer?} {type:literal(delete|timeout|kick|ban)}`,
                    description: cmd.setAuthorizer.description,
                    execute: (ctx, [id, type]) => this.setAuthorizer(ctx, id.asOptionalInteger, type.asLiteral)
                },
                {
                    parameters: `rawmessage {id:integer?} {type:literal(delete|timeout|kick|ban)} {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: cmd.rawMessage.description,
                    execute: (ctx, [id, type, fileExtension]) => this.getRawMessage(ctx, id.asOptionalInteger, type.asLiteral, fileExtension.asLiteral)
                },
                {
                    parameters: `debug {id:integer} {type:literal(delete|timeout|kick|ban)}`,
                    description: cmd.debug.description,
                    execute: (ctx, [id, type]) => this.setDebug(ctx, id.asInteger, type.asLiteral)
                },
                {
                    parameters: `list`,
                    description: cmd.list.description,
                    execute: (ctx) => this.list(ctx)
                },
                {
                    parameters: `info {id:integer}`,
                    description: cmd.info.description,
                    execute: (ctx, [id]) => this.showInfo(ctx, id.asInteger)
                }
            ]
        });
    }

    public async createCensor(context: GuildCommandContext, phrase: string, options: CensorOptions): Promise<CommandResult> {
        const censors = await context.database.guilds.getCensors(context.channel.guild.id);

        let weight = 1;
        switch (typeof options.weight) {
            case `string`:
                weight = parseInt(options.weight);
                if (isNaN(weight))
                    return cmd.errors.weightNotNumber({ value: options.weight });
                break;
            case `number`:
                weight = options.weight;
                break;
        }

        if (weight < 0)
            weight = 0;

        const id = Math.max(...Object.keys(censors?.list ?? {}).map(x => parseInt(x)), 0) + 1;
        await context.database.guilds.setCensor(context.channel.guild.id, id, {
            regex: options.isRegex,
            decancer: options.decancer,
            term: phrase,
            weight: weight,
            reason: options.reason
        });
        return cmd.add.success({ id });
    }

    public async updateCensor(context: GuildCommandContext, id: number, phrase: string | undefined, options: CensorOptions): Promise<CommandResult> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return cmd.errors.doesNotExist({ id });

        let weight = 1;
        switch (typeof options.weight) {
            case `string`:
                weight = parseInt(options.weight);
                if (isNaN(weight))
                    return cmd.errors.weightNotNumber({ value: options.weight });
                break;
            case `number`:
                weight = options.weight;
                break;
        }

        if (weight < 0)
            weight = 0;

        await context.database.guilds.setCensor(context.channel.guild.id, id, {
            ...censor,
            weight: weight,
            reason: options.reason ?? censor.reason,
            regex: phrase !== undefined ? options.isRegex : censor.regex,
            decancer: phrase !== undefined ? options.decancer : censor.decancer,
            term: phrase ?? censor.term
        });
        return cmd.edit.success({ id });
    }

    public async deleteCensor(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return cmd.errors.doesNotExist({ id });

        await context.database.guilds.setCensor(context.channel.guild.id, id, undefined);
        return cmd.delete.success({ id });
    }

    public async ignoreUser(context: GuildCommandContext, user: User, ignored: boolean): Promise<CommandResult> {
        await context.database.guilds.censorIgnoreUser(context.channel.guild.id, user.id, ignored);
        return cmd.exception.user.success({ user });
    }

    public async ignoreChannel(context: GuildCommandContext, channel: KnownChannel, ignored: boolean): Promise<CommandResult> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return cmd.exception.channel.notOnServer;

        await context.database.guilds.censorIgnoreChannel(context.channel.guild.id, channel.id, ignored);
        return cmd.exception.channel.success({ channel });
    }

    public async ignoreRole(context: GuildCommandContext, role: Role, ignored: boolean): Promise<CommandResult> {
        await context.database.guilds.censorIgnoreRole(context.channel.guild.id, role.id, ignored);
        return cmd.exception.role.success({ role });
    }

    public async setMessage(context: GuildCommandContext, id: number | undefined, type: string, code: string | undefined): Promise<CommandResult> {
        if (!allowedTypes.has(type))
            return cmd.errors.invalidType({ type });

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (id !== undefined) {
            const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
            if (censor === undefined)
                return cmd.errors.doesNotExist({ id });
        }

        await context.database.guilds.setCensorRule(context.channel.guild.id, id, type, code === undefined ? undefined : {
            ...rule ?? {},
            content: code,
            author: context.author.id
        });

        return cmd.setMessage.success[id === undefined ? `default` : `id`]({ type, id: id ?? 0 });
    }

    public async setAuthorizer(context: GuildCommandContext, id: number | undefined, type: string): Promise<CommandResult> {
        if (!allowedTypes.has(type))
            return cmd.errors.invalidType({ type });

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (rule === undefined)
            return cmd.errors.messageNotSet[id === undefined ? `default` : `id`]({ type, id: id ?? 0 });

        await context.database.guilds.setCensorRule(context.channel.guild.id, id, type, {
            ...rule,
            authorizer: context.author.id
        });

        return cmd.setAuthorizer.success[id === undefined ? `default` : `id`]({ type, id: id ?? 0 });
    }

    public async getRawMessage(context: GuildCommandContext, id: number | undefined, type: string, fileExtension: string): Promise<CommandResult> {
        if (!allowedTypes.has(type))
            return cmd.errors.invalidType({ type });

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (rule === undefined)
            return cmd.errors.messageNotSet[id === undefined ? `default` : `id`]({ type, id: id ?? 0 });

        return new RawBBTagCommandResult(
            cmd.rawMessage.inline[id === undefined ? `default` : `id`]({ type, id: id ?? 0, content: rule.content }),
            cmd.rawMessage.attached[id === undefined ? `default` : `id`]({ type, id: id ?? 0 }),
            rule.content,
            `censor-${type}-${id ?? `default`}.${fileExtension}`
        );
    }

    public async setDebug(context: GuildCommandContext, id: number, type: string): Promise<CommandResult> {
        if (!allowedTypes.has(type))
            return cmd.errors.invalidType({ type });

        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return cmd.errors.doesNotExist({ id });

        context.cluster.moderation.censors.setDebug(context.channel.guild.id, id, context.author.id, context.channel.id, context.message.id, type);
        return cmd.debug.success({ id });
    }

    public async list(context: GuildCommandContext): Promise<CommandResult> {
        const censors = await context.database.guilds.getCensors(context.channel.guild.id) ?? {};

        if (censors.list?.[NaN] !== undefined) {
            const newId = Math.max(-1, ...Object.keys(censors.list).map(x => parseInt(x)).filter(x => !isNaN(x))) + 1;
            await context.database.guilds.setCensor(context.channel.guild.id, newId, censors.list[NaN]);
            await context.database.guilds.setCensor(context.channel.guild.id, NaN, undefined);
        }

        const users = censors.exception?.user ?? [];
        const roles = censors.exception?.role ?? [];
        const channels = censors.exception?.channel ?? [];
        const description = Object.entries(censors.list ?? {})
            .filter((e): e is [string, GuildCensor] => e[1] !== undefined)
            .map(([id, censor]) => cmd.list.embed.description.censor[censor.regex ? `regex` : `text`]({ id: parseInt(id), term: censor.term }));

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.list.embed.title,
                    description: description.length === 0 ? cmd.list.embed.description.none : cmd.list.embed.description.value({ censors: description }),
                    fields: [
                        {
                            name: cmd.list.embed.field.users.name,
                            value: cmd.list.embed.field.users.value({ users }),
                            inline: true
                        },
                        {
                            name: cmd.list.embed.field.roles.name,
                            value: cmd.list.embed.field.roles.value({ roles }),
                            inline: true
                        },
                        {
                            name: cmd.list.embed.field.channels.name,
                            value: cmd.list.embed.field.channels.value({ channels }),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }

    public async showInfo(context: GuildCommandContext, id: number): Promise<CommandResult> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return cmd.errors.doesNotExist({ id });

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.info.embed.title({ id }),
                    fields: [
                        {
                            name: cmd.info.embed.field.trigger.name[censor.regex ? `regex` : `text`],
                            value: literal(censor.term),
                            inline: false
                        },
                        {
                            name: cmd.info.embed.field.weight.name,
                            value: cmd.info.embed.field.weight.value({ weight: censor.weight }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.reason.name,
                            value: cmd.info.embed.field.reason.value({ reason: censor.reason }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.deleteMessage.name,
                            value: stringifyCensorEvent(censor.deleteMessage),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.timeoutMessage.name,
                            value: stringifyCensorEvent(censor.timeoutMessage),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.kickMessage.name,
                            value: stringifyCensorEvent(censor.kickMessage),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.banMessage.name,
                            value: stringifyCensorEvent(censor.banMessage),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }
}

interface CensorOptions {
    isRegex: boolean;
    decancer: boolean;
    weight?: string | number;
    reason?: string;
}

function stringifyCensorEvent(event: GuildTriggerTag | undefined): IFormattable<string> {
    if (event === undefined)
        return cmd.info.messageFieldValue.notSet;

    return cmd.info.messageFieldValue.set({
        authorId: event.author ?? `????`,
        authorizerId: event.authorizer ?? event.author ?? `????`
    });
}

const allowedTypes = new Set<ModerationType>([ModerationType.BAN, ModerationType.KICK, ModerationType.TIMEOUT, ModerationType.WARN] as const);
