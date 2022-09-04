import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, createSafeRegExp, getRange, parse, randChoose, randInt } from '@blargbot/cluster/utils';
import { SendContent, SendPayload } from '@blargbot/core/types';
import { codeBlock, guard } from '@blargbot/core/utils';
import { GuildFilteredAutoresponse, GuildTriggerTag } from '@blargbot/domain/models';
import { EmbedField, EmbedOptions } from 'eris';

export class AutoResponseCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'autoresponse',
            aliases: ['ar'],
            category: CommandType.ADMIN,
            flags: [
                {
                    flag: 'R',
                    word: 'regex',
                    description: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'
                }, {
                    flag: 'e',
                    word: 'everything',
                    description: 'Makes the added autoresponse respond to everything. Only one is allowed.'
                }
            ],
            definitions: [
                {
                    parameters: 'whitelist {~reason+}',
                    description: 'Requests for the current server to have autoresponses whitelisted',
                    execute: (ctx, [reason]) => this.requestWhitelist(ctx, reason.asString)
                },
                {
                    parameters: 'list',
                    description: 'Displays information about autoresponses',
                    execute: ctx => this.listAutoresponses(ctx)
                },
                {
                    parameters: 'info {id}',
                    description: 'Displays information about an autoresponse',
                    execute: (ctx, [id]) => this.viewAutoresponse(ctx, id.asString)
                },
                {
                    parameters: 'add|create {~pattern+?}',
                    description: 'Adds a autoresponse which matches the given pattern',
                    execute: (ctx, [pattern], { R: isRegex, e: isEverything }) => this.create(ctx, pattern.asOptionalString, isRegex !== undefined, isEverything !== undefined)
                },
                {
                    parameters: 'delete|remove {id}',
                    description: 'Deletes an autoresponse. Ids can be seen when using the `list` subcommand',
                    execute: (ctx, [id]) => this.delete(ctx, id.asString)
                },
                {
                    parameters: 'setpattern {id} {~pattern+}',
                    description: 'Sets the pattern of an autoresponse',
                    execute: (ctx, [id, pattern], { R: isRegex }) => this.setPattern(ctx, id.asString, pattern.asString, isRegex !== undefined)
                },
                {
                    parameters: 'set {id} {~bbtag+}',
                    description: 'Sets the bbtag code to run when the autoresponse is triggered',
                    execute: (ctx, [id, bbtag]) => this.setBBTag(ctx, id.asString, bbtag.asString)
                },
                {
                    parameters: 'raw {id} {fileExtension:literal(bbtag|txt)=bbtag}',
                    description: 'Gets the bbtag that is executed when the autoresponse is triggered',
                    execute: (ctx, [id, fileExtension]) => this.getRaw(ctx, id.asString, fileExtension.asLiteral)
                },
                {
                    parameters: 'setauthorizer {id}',
                    description: 'Sets the autoresponse to use your permissions for the bbtag when it is triggered',
                    execute: (ctx, [id]) => this.setAuthorizer(ctx, id.asString)
                },
                {
                    parameters: 'debug {id}',
                    description: 'Sets the autoresponse to send you the debug output when it is next triggered by one of your messages',
                    execute: (ctx, [id]) => this.setDebug(ctx, id.asString)
                }
            ]
        });
    }

    public async setDebug(context: GuildCommandContext, id: string): Promise<string> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        context.cluster.autoresponses.setDebug(context.channel.guild.id, match.id, context.author.id, context.channel.id, context.message.id);
        return this.success(`The next message that you send that triggers ${match.id === 'everything' ? 'the everything autoresponse' : `autoresponse ${match.id}`} will send the debug output here`);
    }

    public async setBBTag(context: GuildCommandContext, id: string, bbtag: string): Promise<string> {
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

        if (match.id === 'everything')
            await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update });
        else
            await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update });

        return this.success(`Updated the code for ${id === 'everything' ? 'the everything autoresponse' : `autoresponse ${id}`}`);
    }

    public async getRaw(context: GuildCommandContext, id: string, fileExtension: string): Promise<string | SendContent> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        const responseBase = `The raw code for ${match.id === 'everything' ? 'the everything autoresponse' : `autoresponse ${match.id}`} is`;

        const response = this.success(`${responseBase}:\n${codeBlock(match.ar.content)}`);
        return !match.ar.content.includes('`') && guard.checkMessageSize(response)
            ? response
            : {
                content: this.success(`${responseBase} attached`),
                files: [
                    {
                        name: `autoresponse_${match.id}.${fileExtension}`,
                        file: match.ar.content
                    }
                ]
            };
    }

    public async setAuthorizer(context: GuildCommandContext, id: string): Promise<string> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        const update = {
            authorizer: context.author.id
        };

        if (match.id === 'everything')
            await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update });
        else
            await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, { ...match.ar, ...update });

        return this.success(`You are now the authorizer for ${id === 'everything' ? 'the everything autoresponse' : `autoresponse ${id}`}`);
    }

    public async requestWhitelist(context: GuildCommandContext, reason: string): Promise<string | undefined> {
        switch (await context.cluster.autoresponses.whitelist(context.channel.guild.id, context.channel.id, context.author.id, reason)) {
            case 'alreadyApproved': return this.error('This server is already whitelisted!');
            case 'requested': return this.success('Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.');
            default: return undefined;
        }
    }

    public async listAutoresponses(context: GuildCommandContext): Promise<SendPayload> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id) ?? {};

        const embed: EmbedOptions & Required<Pick<EmbedOptions, 'fields'>> = {
            fields: [],
            title: 'Autoresponses'
        };

        const arField = (id: string, trigger: string, triggerType?: string): EmbedField => {
            return {
                name: `Autoresponse \`${id}\``,
                value: `**Trigger${triggerType ?? ''}:**\n${trigger}`,
                inline: true
            };
        };

        if (ars.everything !== undefined && ars.everything !== null)
            embed.fields.push(arField('everything', 'everything'));

        if (ars.filtered !== undefined) {
            embed.fields.push(
                ...Object.entries(ars.filtered)
                    .filter((ar): ar is [string, GuildFilteredAutoresponse] => guard.hasValue(ar[1]))
                    .map((ar) => arField(ar[0], `\`${ar[1].term}\``, ar[1].regex ? ' regex' : ' text'))
            );
        }

        if (embed.fields.length === 0)
            return this.error('There are no autoresponses configured for this server!');

        return { embeds: [embed] };
    }

    public async viewAutoresponse(context: GuildCommandContext, id: string): Promise<SendPayload> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        const authorizer = match.ar.authorizer ?? match.ar.author;

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: match.id === 'everything' ? 'Everything autoresponse' : `Autoresponse #${match.id}`,
            fields: [
                ...'term' in match.ar ? [{ name: `Trigger ${match.ar.regex ? 'regex' : 'text'}`, value: match.ar.term }] : [],
                { name: 'Author', value: `<@${match.ar.author ?? 0}> (${match.ar.author ?? '????'})`, inline: true },
                { name: 'Authorizer', value: `<@${authorizer ?? 0}> (${authorizer ?? '????'})`, inline: true }
            ]
        };
    }

    public async create(context: GuildCommandContext, pattern: string | undefined, isRegex: boolean, isEverything: boolean): Promise<string> {
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
                return this.error('An autoresponse that responds to everything already exists!');
            if (pattern !== undefined)
                return this.error('Autoresponses that respond to everything cannot have a pattern');
            await context.database.guilds.setAutoresponse(context.channel.guild.id, 'everything', tag);
            return this.success(`Your autoresponse has been added! Use \`${context.prefix}autoresponse set everything <bbtag>\` to change the code that it runs`);
        }

        const ids = Object.entries(ars.filtered ?? {}).filter(ar => guard.hasValue(ar[1])).map(ar => parseInt(ar[0]));
        if (ids.length >= 20)
            return this.error('You already have 20 autoresponses!');

        if (pattern === undefined)
            return this.error('If you want to respond to everything, you need to use the `-e` flag.');

        if (isRegex) {
            const regexError = this.#validateRegex(context, pattern);
            if (regexError !== undefined)
                return regexError;
        }

        const id = Math.max(...ids, 0) + 1;
        await context.database.guilds.setAutoresponse(context.channel.guild.id, id, { ...tag, regex: isRegex, term: pattern });
        return this.success(`Your autoresponse has been added! Use \`${context.prefix}autoresponse set ${id} <bbtag>\` to change the code that it runs`);

    }

    public async delete(context: GuildCommandContext, id: string): Promise<string | undefined> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, undefined);
        return 'term' in match.ar
            ? this.success(`Autoresponse ${match.id} (${match.ar.regex ? 'Regex' : 'Pattern'}: \`${match.ar.term}\`) has been deleted!`)
            : this.success('The everything autoresponse has been deleted!');
    }

    public async setPattern(context: GuildCommandContext, id: string, pattern: string, isRegex: boolean): Promise<string | undefined> {
        const accessError = this.#checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        if (pattern === '')
            return this.error('The pattern cannot be empty');

        if (isRegex) {
            const regexError = this.#validateRegex(context, pattern);
            if (regexError !== undefined)
                return regexError;
        }

        const match = await this.#getAutoresponse(context, id);
        if (match === undefined)
            return this.#arNotFound(id);

        if (match.id === 'everything')
            return this.error('Cannot set the pattern for the everything autoresponse');

        await context.database.guilds.setAutoresponse(context.channel.guild.id, match.id, {
            ...match.ar,
            regex: isRegex,
            term: pattern
        });

        return this.success(`The pattern for autoresponse ${id} has been set to ${isRegex ? '(regex)' : ''}\`${pattern}\`!`);
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

    #arNotFound(id: string): string {
        return this.error(`There isnt an ${id === 'everything' ? 'everything autoresponse' : `autoresponse with id \`${id}\``} here!`);
    }

    #checkArAccess(context: GuildCommandContext): string | undefined {
        if (!context.cluster.autoresponses.guilds.has(context.channel.guild.id))
            return this.error('Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`');

        return undefined;
    }

    #validateRegex(context: GuildCommandContext, pattern: string): string | undefined {
        const result = createSafeRegExp(pattern);
        switch (result.state) {
            case 'tooLong': return this.error('Regex is too long!');
            case 'invalid': return this.error('Regex is invalid!');
            case 'unsafe': return this.error('Regex is unsafe!\n' +
                'If you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\n' +
                'You can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>');
        }
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
            : this.error('Your regex cannot match everything!');
    }
}

const symbols = '!@#$%^&*()_+{}|\\[]-=:";\'<>?,./';
const numbers = '0123456790';
const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const holyShitSymbols = getRange(0xf0ff, 0xffff, { maxCount: -1 })
    .map(i => String.fromCharCode(i))
    .join('');
