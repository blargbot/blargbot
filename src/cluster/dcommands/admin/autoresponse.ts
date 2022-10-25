import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, createSafeRegExp, getRange, parse, randChoose, randInt } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { literal } from '@blargbot/domain/messages/index';
import { GuildFilteredAutoresponse, GuildTriggerTag } from '@blargbot/domain/models';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import templates from '../../text';

const cmd = templates.commands.autoResponse;

export class AutoResponseCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'autoresponse',
            aliases: ['ar'],
            category: CommandType.ADMIN,
            flags: [
                { flag: 'R', word: 'regex', description: cmd.flags.regex },
                { flag: 'e', word: 'everything', description: cmd.flags.everything }
            ],
            definitions: [
                {
                    parameters: 'whitelist {~reason+}',
                    description: cmd.whitelist.description,
                    execute: (ctx, [reason]) => this.requestWhitelist(ctx, reason.asString)
                },
                {
                    parameters: 'list',
                    description: cmd.list.description,
                    execute: ctx => this.listAutoresponses(ctx)
                },
                {
                    parameters: 'info {id}',
                    description: cmd.info.description,
                    execute: (ctx, [id]) => this.viewAutoresponse(ctx, id.asString)
                },
                {
                    parameters: 'add|create {~pattern+?}',
                    description: cmd.create.description,
                    execute: (ctx, [pattern], { R: isRegex, e: isEverything }) => this.create(ctx, pattern.asOptionalString, isRegex !== undefined, isEverything !== undefined)
                },
                {
                    parameters: 'delete|remove {id}',
                    description: cmd.delete.description,
                    execute: (ctx, [id]) => this.delete(ctx, id.asString)
                },
                {
                    parameters: 'setpattern {id} {~pattern+}',
                    description: cmd.setPattern.description,
                    execute: (ctx, [id, pattern], { R: isRegex }) => this.setPattern(ctx, id.asString, pattern.asString, isRegex !== undefined)
                },
                {
                    parameters: 'set {id} {~bbtag+}',
                    description: cmd.set.description,
                    execute: (ctx, [id, bbtag]) => this.setBBTag(ctx, id.asString, bbtag.asString)
                },
                {
                    parameters: 'raw {id} {fileExtension:literal(bbtag|txt)=bbtag}',
                    description: cmd.raw.description,
                    execute: (ctx, [id, fileExtension]) => this.getRaw(ctx, id.asString, fileExtension.asLiteral)
                },
                {
                    parameters: 'setauthorizer {id}',
                    description: cmd.setAuthorizer.description,
                    execute: (ctx, [id]) => this.setAuthorizer(ctx, id.asString)
                },
                {
                    parameters: 'debug {id}',
                    description: cmd.debug.description,
                    execute: (ctx, [id]) => this.setDebug(ctx, id.asString)
                }
            ]
        });
    }

    public async setDebug(context: GuildCommandContext, id: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        context.cluster.autoresponses.setDebug(context.channel.guild.id, match.id, context.author.id, context.channel.id, context.message.id);
        return match.id === 'everything'
            ? cmd.debug.success.everything
            : cmd.debug.success.id({ id: match.id });
    }

    public async setBBTag(context: GuildCommandContext, id: string, bbtag: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        const update = {
            author: context.author.id,
            content: bbtag
        };

        await (match.id === 'everything'
            ? context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update })
            : context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update }));
        return match.id === 'everything'
            ? cmd.set.success.everything
            : cmd.set.success.id({ id: match.id });
    }

    public async getRaw(context: GuildCommandContext, id: string, fileExtension: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        return new RawBBTagCommandResult(
            match.id === 'everything'
                ? cmd.raw.inline.everything({ content: match.ar.content })
                : cmd.raw.inline.id({ id: match.id, content: match.ar.content }),
            match.id === 'everything'
                ? cmd.raw.attached.everything
                : cmd.raw.attached.id({ id: match.id }),
            match.ar.content,
            `autoresponse_${match.id}.${fileExtension}`
        );
    }

    public async setAuthorizer(context: GuildCommandContext, id: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        const update = {
            authorizer: context.author.id
        };

        await (match.id === 'everything'
            ? context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update })
            : context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update }));
        return match.id === 'everything'
            ? cmd.setAuthorizer.success.everything
            : cmd.setAuthorizer.success.id({ id: match.id });
    }

    public async requestWhitelist(context: GuildCommandContext, reason: string): Promise<CommandResult> {
        switch (await context.cluster.autoresponses.whitelist(context.channel.guild.id, context.channel.id, context.author, reason)) {
            case 'alreadyApproved': return cmd.whitelist.alreadyApproved;
            case 'requested': return cmd.whitelist.requested;
            default: return undefined;
        }
    }

    public async listAutoresponses(context: GuildCommandContext): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id) ?? {};

        const fields = [];
        if (ars.everything !== undefined && ars.everything !== null) {
            fields.push({
                name: cmd.list.embed.field.name({ id: 'everything' }),
                value: cmd.list.embed.field.value.any,
                inline: true
            });
        }

        if (ars.filtered !== undefined) {
            for (const [id, ar] of Object.entries(ars.filtered)) {
                if (ar === undefined || ar === null)
                    continue;
                fields.push({
                    name: cmd.list.embed.field.name({ id }),
                    value: cmd.list.embed.field.value[ar.regex ? 'regex' : 'text']({ trigger: ar.term }),
                    inline: true
                });
            }
        }

        if (fields.length === 0)
            return cmd.list.noAutoresponses;

        return {
            embeds: [
                {
                    title: cmd.list.embed.title,
                    fields
                }
            ]
        };
    }

    public async viewAutoresponse(context: GuildCommandContext, id: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: match.id === 'everything'
                        ? cmd.info.embed.title.everything
                        : cmd.info.embed.title.id({ id }),
                    fields: [
                        ...'term' in match.ar ? [{
                            name: cmd.info.embed.field.trigger.name[match.ar.regex ? 'regex' : 'text'],
                            value: literal(match.ar.term)
                        }] : [],
                        {
                            name: cmd.info.embed.field.author.name,
                            value: cmd.info.embed.field.author.value({ authorId: match.ar.author ?? '????' }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.authorizer.name,
                            value: cmd.info.embed.field.authorizer.value({ authorizerId: match.ar.authorizer ?? match.ar.author ?? '????' }),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }

    public async create(context: GuildCommandContext, pattern: string | undefined, isRegex: boolean, isEverything: boolean): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id) ?? {};
        const tag: GuildTriggerTag = {
            content: '{//;No content set yet.}',
            author: context.author.id
        };

        if (isEverything) {
            if (ars.everything !== undefined && ars.everything !== null)
                return cmd.create.everythingAlreadyExists;
            if (pattern !== undefined)
                return cmd.create.everythingCannotHavePattern;
            await context.database.guilds.setAutoresponse(context.channel.guild.id, 'everything', tag);
            return cmd.create.success({ prefix: context.prefix, id: 'everything' });
        }

        const ids = Object.entries(ars.filtered ?? {}).filter(ar => guard.hasValue(ar[1])).map(ar => parseInt(ar[0]));
        if (ids.length >= 20)
            return cmd.create.tooMany({ max: 20 });

        if (pattern === undefined)
            return cmd.create.missingEFlag;

        if (isRegex) {
            const regexError = this.#validateRegex(context, pattern);
            if (regexError !== undefined)
                return regexError;
        }

        const id = Math.max(...ids, 0) + 1;
        await context.database.guilds.setAutoresponse(context.channel.guild.id, id, { ...tag, regex: isRegex, term: pattern });
        return cmd.create.success({ prefix: context.prefix, id });

    }

    public async delete(context: GuildCommandContext, id: string): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, undefined);
        return match.id === 'everything' ? cmd.delete.success.everything
            : cmd.delete.success[match.ar.regex ? 'regex' : 'text']({ id: match.id, term: match.ar.term });
    }

    public async setPattern(context: GuildCommandContext, id: string, pattern: string, isRegex: boolean): Promise<CommandResult> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        if (pattern === '')
            return cmd.setPattern.notEmpty;

        if (isRegex) {
            const regexError = this.#validateRegex(context, pattern);
            if (regexError !== undefined)
                return regexError;
        }

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        if (match.id === 'everything')
            return cmd.setPattern.notEverything;

        await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, {
            ...match.ar,
            regex: isRegex,
            term: pattern
        });

        return cmd.setPattern.success[isRegex ? 'regex' : 'text']({ id: match.id, term: pattern });
    }

    async #getAutoresponse(context: GuildCommandContext, id: string): Promise<{ id: number; ar: GuildFilteredAutoresponse; } | { id: 'everything'; ar: GuildTriggerTag; } | undefined> {
        const _id = id === 'everything' ? id : parse.int(id, { strict: true });
        if (_id === undefined)
            return undefined;

        if (_id === 'everything') {
            const ar = await context.database.guilds.getAutoresponse(context.channel.guild.id, _id);
            if (ar === undefined)
                return undefined;
            return { id: _id, ar };
        }

        const ar = await context.database.guilds.getAutoresponse(context.channel.guild.id, _id);
        if (ar === undefined)
            return undefined;
        return { id: _id, ar };

    }

    #arNotFound(id: string): CommandResult {
        return id === 'everything'
            ? cmd.notFoundEverything
            : cmd.notFoundId({ id });
    }

    #checkArAccess(context: GuildCommandContext): CommandResult {
        if (!context.cluster.autoresponses.guilds.has(context.channel.guild.id))
            return cmd.notWhitelisted;

        return undefined;
    }

    #validateRegex(context: GuildCommandContext, pattern: string): CommandResult {
        const result = createSafeRegExp(pattern);
        if (result.state !== 'success')
            return templates.regex[result.state];

        const testPhrases = [];
        for (const set of [letters, numbers, symbols, holyShitSymbols]) {
            for (let i = 0; i < 5; i++) {
                testPhrases.push(randChoose(set, randInt(5, 25)).join(''));
            }
        }
        context.logger.log('Testing the regex', result.regex, 'with the following phrases:\n', testPhrases);
        const res = testPhrases.map(p => result.regex.test(p)).filter(p => p === true).length;
        return res !== testPhrases.length
            ? undefined
            : templates.regex.matchesEverything;
    }
}

const symbols = '!@#$%^&*()_+{}|\\[]-=:";\'<>?,./';
const numbers = '0123456790';
const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const holyShitSymbols = getRange(0xf0ff, 0xffff, { maxCount: -1 })
    .map(i => String.fromCharCode(i))
    .join('');
