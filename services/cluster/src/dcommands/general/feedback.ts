import { CommandType, guard } from '@blargbot/cluster/utils/index.js';
import { FlagResult } from '@blargbot/domain/models/index.js';
import { IFormattable, util } from '@blargbot/formatting';
import moment from 'moment-timezone';

import { CommandContext, GlobalCommand, SendTypingMiddleware } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.feedback;

export class FeedbackCommand extends GlobalCommand {

    public constructor() {
        super({
            name: 'feedback',
            category: CommandType.GENERAL,
            flags: [
                { flag: 'c', word: 'command', description: cmd.flags.command },
                { flag: 'b', word: 'bbtag', description: cmd.flags.bbtag },
                { flag: 'a', word: 'docs', description: cmd.flags.docs },
                { flag: 'o', word: 'other', description: cmd.flags.other }
            ],
            definitions: [
                {
                    parameters: '{description+}',
                    description: cmd.general.description,
                    execute: (ctx, [description], flags) => this.submitFeedback(ctx, description.asString, flags)
                },
                {
                    parameters: 'suggest|suggestion {description+}',
                    description: cmd.suggest.description,
                    execute: (ctx, [description], flags) => this.submitSuggestion(ctx, description.asString, flags)
                },
                {
                    parameters: 'report|bug {description+}',
                    description: cmd.report.description,
                    execute: (ctx, [description], flags) => this.submitBugReport(ctx, description.asString, flags)
                },
                {
                    parameters: 'edit {caseNumber:integer} {description+}',
                    description: cmd.edit.description,
                    execute: (ctx, [caseNumber, description], flags) => this.editFeedback(ctx, caseNumber.asInteger, description.asString, flags)
                }
            ]
        });

        this.middleware.push(new SendTypingMiddleware());
    }

    public async submitFeedback(context: CommandContext, description: string, flags: FlagResult): Promise<CommandResult> {
        if (context.util.isBotStaff(context.author.id)) {
            const words = description.toLowerCase().split(' ');
            if (words.length >= 3) {
                switch (words[0]) {
                    case 'blacklist': return await this.#blacklist(context, true, words[1], words[2]);
                    case 'unblacklist': return await this.#blacklist(context, false, words[1], words[2]);
                }
            }
        }

        return await this.#submit(context, cmd.types.feedback, description, context.config.discord.channels.feedback, flags, false, 0xaaaf0c);
    }

    public async submitBugReport(context: CommandContext, description: string, flags: FlagResult): Promise<CommandResult> {
        return await this.#submit(context, cmd.types.bugReport, description, context.config.discord.channels.bugreports, flags, true, 0xaf0c0c);
    }

    public async submitSuggestion(context: CommandContext, description: string, flags: FlagResult): Promise<CommandResult> {
        return await this.#submit(context, cmd.types.suggestion, description, context.config.discord.channels.suggestions, flags, false, 0x1faf0c);
    }

    public async editFeedback(context: CommandContext, caseNumber: number, description: string, flags: FlagResult): Promise<CommandResult> {
        const blacklisted = await this.#checkBlacklist(context);
        if (blacklisted !== false)
            return cmd.errors.blacklisted[blacklisted]({ prefix: context.prefix });

        const suggestion = await context.database.suggestions.get(caseNumber);

        if (suggestion === undefined)
            return cmd.edit.unknownCase({ caseNumber });

        const suggester = await context.database.suggesters.upsert(context.author.id, `${context.author.username}#${context.author.discriminator}`);
        if (suggester === undefined || !suggestion.Author.includes(suggester))
            return cmd.edit.notOwner;

        const res = await this.#getSuggestionDetails(context, description, flags);
        if ('result' in res)
            return res.result;

        const { title, subTypes } = res;
        description = res.description;

        await context.database.suggestions.update(caseNumber, {
            /* eslint-disable @typescript-eslint/naming-convention */
            Type: subTypes,
            Title: title,
            Description: description,
            Message: context.message.id,
            Channel: context.channel.id,
            Edits: (suggestion.Edits ?? 0) + 1,
            'Last Edited': moment().valueOf()
            /* eslint-enable @typescript-eslint/naming-convention */
        });

        return cmd.edit.success;
    }

    async #getSuggestionDetails(
        context: CommandContext,
        description: string,
        flags: FlagResult
    ): Promise<{ result: CommandResult; } | { description: string; title: string; subTypes: string[]; }> {
        const sections = description.split('\n');
        const title = sections[0].trim();
        description = sections.slice(1).join('\n').trim();

        if (title.length > 64)
            return { result: cmd.errors.titleTooLong({ max: 64 }) };

        const subTypes = await this.#getSubtypes(context, flags);
        if (subTypes.length === 0)
            return { result: cmd.errors.noType };

        return { description, title, subTypes };
    }

    async #submit(
        context: CommandContext,
        type: IFormattable<string>,
        description: string,
        channelId: string,
        flags: FlagResult,
        isBug: boolean,
        colour: number
    ): Promise<CommandResult> {
        const blacklisted = await this.#checkBlacklist(context);
        if (blacklisted !== false)
            return cmd.errors.blacklisted[blacklisted]({ prefix: context.prefix });

        await context.channel.sendTyping();

        const res = await this.#getSuggestionDetails(context, description, flags);
        if ('result' in res)
            return res.result;

        const { title, subTypes } = res;
        description = res.description;

        const suggester = await context.database.suggesters.upsert(context.author.id, `${context.author.username}#${context.author.discriminator}`);
        if (suggester === undefined)
            return cmd.general.unexpectedError;

        const record = await context.database.suggestions.create({
            /* eslint-disable @typescript-eslint/naming-convention */
            AA: true,
            Bug: isBug,
            Title: title,
            Description: description,
            Type: subTypes,
            Author: [suggester],
            Channel: context.channel.id,
            Message: context.message.id
            /* eslint-enable @typescript-eslint/naming-convention */
        });
        if (record === undefined)
            return cmd.general.unexpectedError;

        const websiteLink = context.util.websiteLink(`feedback/${record}`);
        await context.send(channelId, {
            embeds: [
                {
                    title: type,
                    url: websiteLink,
                    description: cmd.general.embed.description({
                        title,
                        description
                    }),
                    color: colour,
                    author: context.util.embedifyAuthor(context.author),
                    fields: [
                        {
                            name: cmd.general.embed.field.types.name,
                            value: cmd.general.embed.field.types.value({ types: subTypes })
                        },
                        guard.isGuildCommandContext(context)
                            ? {
                                name: util.literal(context.channel.guild.name),
                                value: util.literal(context.channel.guild.id),
                                inline: true
                            }
                            : {
                                name: cmd.general.dm,
                                value: cmd.general.dm,
                                inline: true
                            },
                        guard.isGuildCommandContext(context)
                            ? {
                                name: util.literal(context.channel.name),
                                value: util.literal(context.channel.id),
                                inline: true
                            }
                            : {
                                name: cmd.general.dm,
                                value: util.literal(context.channel.id),
                                inline: true
                            }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: cmd.general.embed.footer.text({ caseId: record, messageId: context.message.id })
                    }
                }
            ]
        });

        return cmd.general.success({ type, caseId: record, link: websiteLink });
    }

    async #getSubtypes(context: CommandContext, flags: FlagResult): Promise<string[]> {
        const result = [];

        if (flags.c !== undefined) result.push('Command');
        if (flags.b !== undefined) result.push('BBTag');
        if (flags.a !== undefined) result.push('Documentation');
        if (flags.o !== undefined) result.push('Other Functionality');

        if (result.length > 0)
            return result;

        const picked = await context.queryMultiple({
            context: context.channel,
            actors: context.author,
            prompt: cmd.general.queryType.prompt,
            placeholder: cmd.general.queryType.placeholder,
            minCount: 1,
            choices: [
                { label: cmd.general.types.command, value: 'Command', emoji: { name: '🛠️' } },
                { label: cmd.general.types.bbtag, value: 'BBTag', emoji: { name: '💻' } },
                { label: cmd.general.types.documentation, value: 'Documentation', emoji: { name: '📖' } },
                { label: cmd.general.types.other, value: 'Other Functionality', emoji: { name: '❓' } }
            ]
        });

        return picked.state === 'SUCCESS' ? picked.value : [];
    }

    async #blacklist(context: CommandContext, add: boolean, type: string, id: string): Promise<CommandResult> {
        if (!isBlacklistType(type))
            return cmd.blacklist.unknownType({ type });

        const blacklist = await context.database.vars.get('blacklist') ?? { guilds: [], users: [] };
        const users = [...blacklist.users];
        const guilds = [...blacklist.guilds];
        const ids = type === 'user' ? users : guilds;

        if (add) {
            if (ids.includes(id))
                return cmd.blacklist.alreadyBlacklisted[type];
            ids.push(id);
        } else {
            const index = ids.indexOf(id);
            if (index === -1)
                return cmd.blacklist.notBlacklisted[type];
            ids.splice(index, 1);
        }

        await context.database.vars.set('blacklist', { users, guilds });

        return cmd.blacklist.success[type]({ id, added: add });
    }

    async #checkBlacklist(context: CommandContext): Promise<false | 'guild' | 'user'> {
        if (context.util.isBotStaff(context.author.id))
            return false;

        const blacklist = await context.database.vars.get('blacklist');
        if (blacklist === undefined)
            return false;

        if (blacklist.users.includes(context.author.id))
            return 'user';

        if (guard.isGuildCommandContext(context) && blacklist.guilds.includes(context.channel.guild.id))
            return 'guild';

        return false;
    }
}

function isBlacklistType(value: string): value is 'user' | 'guild' {
    return value === 'user' || value === 'guild';
}
