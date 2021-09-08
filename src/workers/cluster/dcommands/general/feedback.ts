import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { CommandType, guard } from '@cluster/utils';
import { humanize } from '@core/utils';
import moment from 'moment-timezone';

export class FeedbackCommand extends BaseGlobalCommand {

    public constructor() {
        super({
            name: 'feedback',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{description+}',
                    description: 'Give me general feedback about the bot',
                    execute: (ctx, [description], flags) => this.submitFeedback(ctx, description.asString, flags)
                },
                {
                    parameters: 'suggest|suggestion {description+}',
                    description: 'Tell me something you want to be added or changed',
                    execute: (ctx, [description], flags) => this.submitSuggestion(ctx, description.asString, flags)
                },
                {
                    parameters: 'report|bug {description+}',
                    description: 'Let me know about a bug you found',
                    execute: (ctx, [description], flags) => this.submitBugReport(ctx, description.asString, flags)
                },
                {
                    parameters: 'edit {caseNumber:integer} {description+}',
                    description: 'Edit some feedback you have previously sent',
                    execute: (ctx, [caseNumber, description], flags) => this.editFeedback(ctx, caseNumber.asInteger, description.asString, flags)
                }
            ],
            flags: [
                { flag: 'c', word: 'command', description: 'Signify your feedack is for a command' },
                { flag: 'b', word: 'bbtag', description: 'Signify your feedack is for BBTag' },
                { flag: 'a', word: 'docs', description: 'Signify your feedack is for documentation' },
                { flag: 'o', word: 'other', description: 'Signify your feedack is for other functionality' }
            ]
        });
    }

    public async submitFeedback(context: CommandContext, description: string, flags: FlagResult): Promise<string> {
        if (context.util.isBotOwner(context.author.id)) {
            const words = description.toLowerCase().split(' ');
            if (words.length >= 3) {
                switch (words[0]) {
                    case 'blacklist': return await this.blacklist(context, true, words[1], words[2]);
                    case 'unblacklist': return await this.blacklist(context, false, words[1], words[2]);
                }
            }
        }

        return await this.submit(context, 'Feedback', description, context.config.discord.channels.feedback, flags, false, 0xaaaf0c);
    }

    public async submitBugReport(context: CommandContext, description: string, flags: FlagResult): Promise<string> {
        return await this.submit(context, 'Bug Report', description, context.config.discord.channels.bugreports, flags, true, 0xaf0c0c);
    }

    public async submitSuggestion(context: CommandContext, description: string, flags: FlagResult): Promise<string> {
        return await this.submit(context, 'Suggestion', description, context.config.discord.channels.suggestions, flags, false, 0x1faf0c);
    }

    public async editFeedback(context: CommandContext, caseNumber: number, description: string, flags: FlagResult): Promise<string> {
        switch (await this.checkBlacklist(context)) {
            case 'GUILD': return this.blacklistedError(context, 'GUILD');
            case 'USER': return this.blacklistedError(context, 'USER');
        }

        await context.channel.sendTyping();

        const suggestion = await context.database.suggestions.get(caseNumber);

        if (suggestion === undefined)
            return this.error(`I couldnt find any feedback with the case number ${caseNumber}!`);

        const suggestor = await context.database.suggestors.upsert(context.author.id, humanize.fullName(context.author));
        if (suggestor === undefined || !suggestion.Author.includes(suggestor))
            return this.error('You cant edit someone elses suggestion.');

        const res = await this.getSuggestionDetails(context, description, flags);
        if (typeof res === 'string')
            return res;

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

        return this.success('Your case has been updated.');
    }

    private async getSuggestionDetails(
        context: CommandContext,
        description: string,
        flags: FlagResult
    ): Promise<string | { description: string; title: string; subTypes: string[]; }> {
        const sections = description.split('\n');
        const title = sections[0].trim();
        description = sections.slice(1).join('\n').trim();

        if (title.length > 64)
            return this.error('The first line of your suggestion cannot be more than 64 characters!');

        const subTypes = await this.getSubtypes(context, flags);
        if (subTypes.length === 0)
            return this.error('You need to provide at least 1 feedback type.');

        return { description, title, subTypes };
    }

    private async submit(
        context: CommandContext,
        type: string,
        description: string,
        channelId: string,
        flags: FlagResult,
        isBug: boolean,
        color: number
    ): Promise<string> {
        switch (await this.checkBlacklist(context)) {
            case 'GUILD': return this.blacklistedError(context, 'GUILD');
            case 'USER': return this.blacklistedError(context, 'USER');
        }

        await context.channel.sendTyping();

        const res = await this.getSuggestionDetails(context, description, flags);
        if (typeof res === 'string')
            return res;

        const { title, subTypes } = res;
        description = res.description;

        const suggestor = await context.database.suggestors.upsert(context.author.id, humanize.fullName(context.author));
        if (suggestor === undefined)
            return this.error('Something went wrong while trying to submit that! Please try again');

        const record = await context.database.suggestions.create({
            /* eslint-disable @typescript-eslint/naming-convention */
            AA: true,
            Bug: isBug,
            Title: title,
            Description: description.length === 0 ? '' : description,
            Type: subTypes,
            Author: [suggestor],
            Channel: context.channel.id,
            Message: context.message.id
            /* eslint-enable @typescript-eslint/naming-convention */
        });
        if (record === undefined)
            return this.error('Something went wrong while trying to submit that! Please try again');

        const websiteLink = context.util.websiteLink(`feedback/${record}`);
        await context.send(channelId, {
            title: type,
            url: websiteLink,
            description: `**${title}**\n\n${description}`,
            color: color,
            author: context.util.embedifyAuthor(context.author),
            fields: [
                { name: 'Types', value: subTypes.join('\n') },
                guard.isGuildCommandContext(context)
                    ? { name: context.channel.guild.name, value: context.channel.guild.id, inline: true }
                    : { name: 'DM', value: 'DM', inline: true },
                guard.isGuildCommandContext(context)
                    ? { name: context.channel.name, value: context.channel.id, inline: true }
                    : { name: 'DM', value: context.channel.id, inline: true }
            ],
            timestamp: new Date(),
            footer: {
                text: `Case ${record} | ${context.message.id}`
            }
        });

        return this.success(`${type} has been sent with the ID ${record}! 👌\n\nYou can view your ${type.toLowerCase()} here: <${websiteLink}>`);
    }

    private async getSubtypes(context: CommandContext, flags: FlagResult): Promise<string[]> {
        const result = [];

        if (flags.c !== undefined) result.push('Command');
        if (flags.b !== undefined) result.push('BBTag');
        if (flags.a !== undefined) result.push('Documentation');
        if (flags.o !== undefined) result.push('Other Functionality');

        if (result.length > 0)
            return result;

        const picked = await context.util.queryMultiple({
            context: context.channel,
            actors: context.author,
            prompt: this.info('Please select the types that apply to your suggestion'),
            placeholder: 'Select your suggestion type',
            minCount: 1,
            choices: [
                { label: 'Command', value: 'Command', emoji: '🛠️' },
                { label: 'BBTag', value: 'BBTag', emoji: '💻' },
                { label: 'Documentation', value: 'Documentation', emoji: '📖' },
                { label: 'Other Functionality', value: 'Other Functionality', emoji: '❓' }
            ]
        });

        return picked.state === 'SUCCESS' ? picked.value : [];
    }

    private async blacklist(context: CommandContext, add: boolean, type: string, id: string): Promise<string> {
        const blacklist = await context.database.vars.get('blacklist') ?? { guilds: [], users: [] };
        let ids: string[];
        let guilds: string[];
        let users: string[];
        switch (type) {
            case 'user':
                users = ids = [...blacklist.users];
                guilds = [...blacklist.guilds];
                break;
            case 'guild':
                users = [...blacklist.users];
                guilds = ids = [...blacklist.guilds];
                break;
            default:
                return this.error(`I dont know how to blacklist a ${type}! only \`guild\` and \`user\``);
        }

        if (add) {
            if (ids.includes(id))
                return this.error(`That ${type} id is already blacklisted!`);
            ids.push(id);
        } else {
            const index = ids.indexOf(id);
            if (index === -1)
                return this.error(`That ${type} id is not blacklisted!`);
            ids.splice(index, 1);
        }

        await context.database.vars.set('blacklist', { users, guilds });

        return this.success(`The ${type} ${id} has been ${add ? 'blacklisted' : 'removed from the blacklist'}`);
    }

    private blacklistedError(context: CommandContext, type: 'GUILD' | 'USER'): string {
        const who = type === 'GUILD' ? 'your guild has' : 'you have';
        return this.error(`Sorry, ${who} been blacklisted from the use of the \`${context.prefix}feedback\` command. If you wish to appeal this, please join my support guild. You can find a link by doing \`${context.prefix}invite\`.`);
    }

    private async checkBlacklist(context: CommandContext): Promise<false | 'GUILD' | 'USER'> {
        if (context.util.isBotOwner(context.author.id))
            return false;

        const blacklist = await context.database.vars.get('blacklist');
        if (blacklist === undefined)
            return false;

        if (blacklist.users.includes(context.author.id))
            return 'USER';

        if (guard.isGuildCommandContext(context) && blacklist.guilds.includes(context.channel.guild.id))
            return 'GUILD';

        return false;
    }
}
