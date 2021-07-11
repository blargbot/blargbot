import { EmbedOptions } from 'eris';
import { BaseGuildCommand, commandTypes, GuildCommandContext, SendPayload, createSafeRegExp, randChoose, randInt, between, getRange, parse } from '../core';

export class AutoResponseCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'autoresponse',
            aliases: ['ar'],
            category: commandTypes.ADMIN,
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
                    execute: (ctx, [reason]) => this.requestWhitelist(ctx, reason)
                },
                {
                    parameters: 'list|info',
                    description: 'Displays information about autoresponses',
                    execute: ctx => this.listAutoresponses(ctx)
                },
                {
                    parameters: 'add|create {~pattern+}',
                    description: 'Adds a autoresponse which matches the given pattern',
                    execute: (ctx, [pattern], { R: isRegex, e: isEverything }) => this.addAutoresponse(ctx, pattern, isRegex !== undefined, isEverything !== undefined)
                },
                {
                    parameters: 'delete|remove',
                    description: 'Brings up a menu to remove an autoresponse',
                    execute: ctx => this.removeAutoresponse(ctx)
                },
                {
                    parameters: 'edit {~pattern+}',
                    description: 'Brings up a menu to edit an autoresponse',
                    execute: (ctx, [pattern], { R: isRegex, e: isEverything }) => this.editAutoresponse(ctx, pattern, isRegex !== undefined, isEverything !== undefined)
                }
            ]
        });
    }

    public async requestWhitelist(context: GuildCommandContext, reason: string): Promise<string | undefined> {
        switch (await context.cluster.autoresponses.whitelist(context.channel.guild.id, context.channel.id, context.author.id, reason)) {
            case 'alreadyApproved': return this.error('This server is already whitelisted!');
            case 'requested': return this.success('Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.');
            default: return undefined;
        }
    }

    public async listAutoresponses(context: GuildCommandContext): Promise<SendPayload> {
        const accessError = this.checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id);

        const embed: EmbedOptions & Required<Pick<EmbedOptions, 'fields'>> = {
            fields: [],
            title: 'Autoresponses'
        };
        if (ars.everything !== undefined) {
            embed.fields.push({
                name: `Command: \`${ars.everything.executes}\``,
                value: 'Trigger: everything',
                inline: true
            });
        }

        if (ars.list !== undefined) {
            embed.fields.push(...ars.list.map(ar => ({
                name: `Command: \`${ar.executes}\``,
                value: `Trigger: \`${ar.term}\`${ar.regex ? ' (regex)' : ''}`,
                inline: true
            })));
        }

        if (embed.fields.length === 0)
            return this.error('There are no autoresponses configured for this server!');

        return { embed };
    }

    public async addAutoresponse(context: GuildCommandContext, pattern: string, isRegex: boolean, isEverything: boolean): Promise<string> {
        const accessError = this.checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        let commandName;
        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id);
        const commands = await context.database.guilds.listCommands(context.channel.guild.id);
        const commandNames = new Set(commands.map(c => c.name));
        let commandIndex = 0;
        if (isEverything) {
            if (ars.everything?.executes !== undefined)
                return this.error(`An autoresponse that responds to everything already exists! It executes the following ccommand: \`${ars.everything.executes}\``);
            if (pattern !== '')
                return this.error('Autoresponses that respond to everything cannot have a pattern');
            while (commandNames.has(commandName = `_autoresponse_${commandIndex++}`));
            await context.database.guilds.setAutoresponse(context.channel.guild.id, 'everything', { executes: commandName });
        } else {
            if ((ars.list?.length ?? 0) >= 20)
                return this.error('You already have 20 autoresponses!');
            if (pattern === '')
                return this.error('If you want to respond to everything, you need to use the `-e` flag.');
            if (isRegex) {
                const regexError = this.validateRegex(context, pattern);
                if (regexError !== undefined)
                    return regexError;
            }
            while (commandNames.has(commandName = `_autoresponse_${commandIndex++}`));
            await context.database.guilds.addAutoresponse(context.channel.guild.id, { executes: commandName, regex: isRegex, term: pattern });
        }

        await context.database.guilds.setCommand(context.channel.guild.id, commandName, {
            content: '{//;This custom command was generated by an autoresponse.}',
            author: context.author.id,
            hidden: true,
            managed: true
        });

        return this.success(`Your autoresponse has been added! It will execute the hidden ccommand: \`${commandName}\``);
    }

    public async removeAutoresponse(context: GuildCommandContext): Promise<string | undefined> {
        const accessError = this.checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        const ar = await this.requestEditableAutoresponse(context, true);
        if (typeof ar === 'string' || ar === undefined)
            return ar;

        const match = await context.database.guilds.getAutoresponse(context.channel.guild.id, ar.index);
        await context.database.guilds.setAutoresponse(context.channel.guild.id, ar.index, undefined);
        await context.database.guilds.setCommand(context.channel.guild.id, ar.executes, undefined);

        return match === undefined ? this.success('Autoresponse removed!')
            : 'term' in match ? this.success(`Autoresponse \`${match.term}\` removed!`)
                : this.success('The everything autoresponse has been removed!');
    }

    public async editAutoresponse(context: GuildCommandContext, pattern: string, isRegex: boolean, isEverything: boolean): Promise<string | undefined> {
        const accessError = this.checkArAccess(context);
        if (accessError !== undefined)
            return accessError;

        if (isEverything)
            return this.error('You can\'t edit the everything autoresponse.');
        if (pattern === '')
            return this.error('The pattern cannot be empty');
        if (isRegex) {
            const regexError = this.validateRegex(context, pattern);
            if (regexError !== undefined)
                return regexError;
        }

        const ar = await this.requestEditableAutoresponse(context, false);
        if (typeof ar === 'string' || ar === undefined)
            return ar;

        await context.database.guilds.setAutoresponse(context.channel.guild.id, ar.index, {
            executes: ar.executes,
            regex: isRegex,
            term: pattern
        });

        return this.success(`Autoresponse \`${pattern}\` has been edited!`);
    }

    private checkArAccess(context: GuildCommandContext): string | undefined {
        if (!context.cluster.autoresponses.guilds.has(context.channel.guild.id))
            return this.error('Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`');

        return undefined;
    }

    private validateRegex(context: GuildCommandContext, pattern: string): string | undefined {
        const result = createSafeRegExp(pattern);
        if (!result.success) {
            switch (result.reason) {
                case 'tooLong': return this.error('Regex is too long!');
                case 'invalid': return this.error('Regex is invalid!');
                case 'unsafe': return this.error('Regex is unsafe!\n') +
                    'If you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\n' +
                    'You can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>';
            }
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

    private async requestEditableAutoresponse(context: GuildCommandContext, includeEverything: false): Promise<string | undefined | { index: number; executes: string; }>;
    private async requestEditableAutoresponse(context: GuildCommandContext, includeEverything: true): Promise<string | undefined | { index: number | 'everything'; executes: string; }>;
    private async requestEditableAutoresponse(context: GuildCommandContext, includeEverything: boolean): Promise<string | undefined | { index: number | 'everything'; executes: string; }> {
        const ars = await context.database.guilds.getAutoresponses(context.channel.guild.id);
        const indexes: Array<{ name: string; result: { index: number | 'everything'; executes: string; }; }> = [];
        if (includeEverything && ars.everything !== undefined)
            indexes.push({ name: 'Trigger: Everything', result: { index: 'everything', executes: ars.everything.executes } });
        if (ars.list !== undefined) {
            for (let i = 0; i < ars.list.length; i++) {
                const ar = ars.list[i];
                indexes.push({ name: `Trigger: \`${ar.term}\`${ar.regex ? ' (regex)' : ''}`, result: { index: i, executes: ar.executes } });
            }
        }
        if (indexes.length === 0)
            return this.error('There are no autoresponses on this guild!');

        const result = await context.util.awaitQuery(
            context.channel,
            context.author,
            `Autoresponses:
${indexes.map((e, i) => `${i + 1}. ${e.name}`).join('\n')}
Please type the number of the autoresponse you wish to remove, or type 'c' to cancel. This prompt will expire in 5 minutes.`,
            message => message.content.toLowerCase() === 'c' || between(parse.int(message.content), 1, indexes.length, true),
            300000
        );

        if (result === undefined)
            return undefined;
        if (result.content.toLowerCase() === 'c')
            return 'Query cancelled';
        return indexes[parse.int(result.content) - 1].result;
    }
}
const symbols = '!@#$%^&*()_+{}|\\[]-=:";\'<>?,./';
const numbers = '0123456790';
const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const holyShitSymbols = getRange(0xf0ff, 0xffff, { maxCount: -1 })
    .map(i => String.fromCharCode(i))
    .join('');
