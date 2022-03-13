import { Cluster, ClusterUtilities } from '@cluster';
import { getDocsEmbed } from '@cluster/bbtag';
import { BaseGuildCommand, CommandContext } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { bbtag, codeBlock, CommandType, guard, humanize, parse, pluralise as p } from '@cluster/utils';
import { SendContent, SendPayload, StoredTag } from '@core/types';
import { EmbedField, EmbedOptions, FileContent, User } from 'eris';
import moment from 'moment';
import { Duration } from 'moment-timezone';
import fetch from 'node-fetch';

export class TagCommand extends BaseGuildCommand {
    public constructor(cluster: Cluster) {
        super({
            name: 'tag',
            aliases: ['t'],
            category: CommandType.GENERAL,
            description: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\n'
                + `For more information about BBTag, visit <${cluster.util.websiteLink('/tags')}>.\n`
                + `By creating a tag, you acknowledge that you agree to the Terms of Service (<${cluster.util.websiteLink('/tags/tos')}>)`,
            definitions: [
                {
                    parameters: '{tagName} {~args+?}',
                    execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName.asString, args.asOptionalString, false),
                    description: 'Runs a user created tag with some arguments'
                },
                {
                    parameters: 'test|eval|exec|vtest',
                    subcommands: [
                        {
                            parameters: '{~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', false),
                            description: 'Uses the BBTag engine to execute the content as if it was a tag'
                        },
                        {
                            parameters: 'debug {~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', true),
                            description: 'Uses the BBTag engine to execute the content as if it was a tag and will return the debug output'
                        }
                    ]
                },
                {
                    parameters: 'docs {topic+?}',
                    execute: (ctx, [topic]) => this.showDocs(ctx, topic.asOptionalString),
                    description: 'Returns helpful information about the specified topic.'
                },
                {
                    parameters: 'debug {tagName} {~args+?}',
                    execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName.asString, args.asOptionalString, true),
                    description: 'Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.'
                },
                {
                    parameters: 'create|add {tagName?} {~content+?}',
                    execute: (ctx, [tagName, content]) => this.createTag(ctx, tagName.asOptionalString, content.asOptionalString),
                    description: 'Creates a new tag with the content you give'
                },
                {
                    parameters: 'edit {tagName?} {~content+?}',
                    execute: (ctx, [tagName, content]) => this.editTag(ctx, tagName.asOptionalString, content.asOptionalString),
                    description: 'Edits an existing tag to have the content you specify'
                },
                {
                    parameters: 'set {tagName?} {~content+?}',
                    execute: (ctx, [tagName, content]) => this.setTag(ctx, tagName.asOptionalString, content.asOptionalString),
                    description: 'Sets the tag to have the content you specify. If the tag doesnt exist it will be created.'
                },
                {
                    parameters: 'delete|remove {tagName?}',
                    execute: (ctx, [tagName]) => this.deleteTag(ctx, tagName.asOptionalString),
                    description: 'Deletes an existing tag'
                },
                {
                    parameters: 'rename {oldName?} {newName?}',
                    execute: (ctx, [oldName, newName]) => this.renameTag(ctx, oldName.asOptionalString, newName.asOptionalString),
                    description: 'Renames the tag'
                },
                {
                    parameters: 'raw {tagName?}',
                    execute: (ctx, [tagName]) => this.getRawTag(ctx, tagName.asOptionalString),
                    description: 'Uses the BBTag engine to execute the content as it was a tag'
                },
                {
                    parameters: 'list {author+?}',
                    execute: (ctx, [author]) => this.listTags(ctx, author.asOptionalString),
                    description: 'Lists all tags, or tags made by a specific author'
                },
                {
                    parameters: 'search {tagName?}',
                    execute: (ctx, [tagName]) => this.searchTags(ctx, tagName.asOptionalString),
                    description: 'Searches for a tag based on the provided name'
                },
                {
                    parameters: 'permdelete {tagName} {reason+}',
                    execute: (ctx, [tagName, reason]) => this.disableTag(ctx, tagName.asString, reason.asString),
                    description: 'Marks the tag name as deleted forever, so no one can ever use it'
                },
                {
                    parameters: 'cooldown {tagName} {duration:duration+=0ms}',
                    execute: (ctx, [tagName, duration]) => this.setTagCooldown(ctx, tagName.asString, duration.asDuration),
                    description: 'Sets the cooldown of a tag, in milliseconds'
                },
                {
                    parameters: 'author {tagName?}',
                    execute: (ctx, [tagName]) => this.getTagAuthor(ctx, tagName.asOptionalString),
                    description: 'Displays the name of the tag\'s author'
                },
                {
                    parameters: 'info {tagName?}',
                    execute: (ctx, [tagName]) => this.getTagInfo(ctx, tagName.asOptionalString),
                    description: 'Displays information about a tag'
                },
                {
                    parameters: 'top ',
                    execute: (ctx) => this.getTopTags(ctx),
                    description: 'Displays the top 5 tags'
                },
                {
                    parameters: 'report {tagName} {reason+?}',
                    execute: (ctx, [tagName, reason]) => this.reportTag(ctx, tagName.asString, reason.asOptionalString),
                    description: 'Reports a tag as violating the ToS'
                },
                {
                    parameters: 'setlang {tagName} {language}',
                    execute: (ctx, [tagName, language]) => this.setTagLanguage(ctx, tagName.asString, language.asString),
                    description: 'Sets the language to use when returning the raw text of your tag'
                },
                {
                    parameters: 'favourite|favorite|favourites|favorites',
                    subcommands: [
                        {
                            parameters: '',
                            execute: (ctx) => this.listFavouriteTags(ctx),
                            description: 'Displays a list of the tags you have favourited'
                        },
                        {
                            parameters: '{tagName}',
                            execute: (ctx, [tagName]) => this.toggleFavouriteTag(ctx, tagName.asString),
                            description: 'Adds or removes a tag from your list of favourites'
                        }
                    ]
                },
                {
                    parameters: 'flag|flags',
                    subcommands: [
                        {
                            parameters: '{tagName}',
                            execute: (ctx, [tagName]) => this.getTagFlags(ctx, tagName.asString),
                            description: 'Lists the flags the tag accepts'
                        },
                        {
                            parameters: 'create|add {tagName} {~flags+}',
                            execute: (ctx, [tagName, flags]) => this.addTagFlags(ctx, tagName.asString, flags.asString),
                            description: 'Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                'e.g. `b!t flags add mytag -c category The category you want to use -n name Your name`'
                        },
                        {
                            parameters: 'delete|remove {tagName} {~flags+}',
                            execute: (ctx, [tagName, flags]) => this.removeTagFlags(ctx, tagName.asString, flags.asString),
                            description: 'Removes multiple flags from your tag. Flags should be of the form `-<f>`\n' +
                                'e.g. `b!t flags remove mytag -c -n`'
                        }
                    ]
                }
            ]
        });
    }

    public async runTag(
        context: GuildCommandContext,
        tagName: string,
        input: string | undefined,
        debug: boolean
    ): Promise<string | SendContent | undefined> {
        const match = await this.requestReadableTag(context, tagName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== context.author.id)
            return this.error('You cannot debug someone elses tag.');

        await context.database.tags.incrementUses(match.name, 1);

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input ?? '',
            isCC: false,
            limit: 'tagLimit',
            rootTagName: match.name,
            author: match.author,
            authorizer: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        return debug ? bbtag.createDebugOutput(result) : undefined;
    }

    public async runRaw(
        context: GuildCommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<string | SendContent | undefined> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: false,
            limit: 'tagLimit',
            rootTagName: 'test',
            author: context.author.id
        });

        return debug ? bbtag.createDebugOutput(result) : undefined;
    }

    public async createTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestCreatableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        return await this.saveTag(context, 'created', match.name, content, undefined);
    }

    public async editTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;
        if (content === undefined) {
            if (context.message.attachments.length > 0) {
                const firstAttachment = context.message.attachments[0];
                if (firstAttachment.filename.endsWith('.bbtag') || firstAttachment.filename.endsWith('.txt'))
                    content = await (await fetch(firstAttachment.url)).text();
            }
        }

        return await this.saveTag(context, 'edited', match.name, content, match);
    }

    public async deleteTag(context: GuildCommandContext, tagName: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        await context.database.tags.delete(match.name);
        void this.logChange(context, TagChangeAction.DELETE, context.author, context.id, {
            author: `${(await context.database.users.get(match.author))?.username ?? 'undefined'} (${match.author})`,
            tag: match.name,
            content: match.content
        });
        return this.success(`The \`${match.name}\` tag is gone forever!`);
    }

    public async setTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestSettableTag(context, tagName);
        if (typeof match !== 'object')
            return match;
        if (content === undefined) {
            if (context.message.attachments.length > 0) {
                const firstAttachment = context.message.attachments[0];
                if (firstAttachment.filename.endsWith('.bbtag') || firstAttachment.filename.endsWith('.txt'))
                    content = await (await fetch(firstAttachment.url)).text();
            }
        }
        return await this.saveTag(context, 'set', match.name, content, match.tag);
    }

    public async renameTag(context: GuildCommandContext, oldName: string | undefined, newName: string | undefined): Promise<string | undefined> {
        const from = await this.requestEditableTag(context, oldName);
        if (typeof from !== 'object')
            return from;

        const to = await this.requestCreatableTag(context, newName);
        if (typeof to !== 'object')
            return to;

        await context.database.tags.delete(from.name);
        await context.database.tags.add({
            ...from,
            name: to.name
        });

        void this.logChange(context, TagChangeAction.RENAME, context.author, context.id, {
            oldName: from.name,
            newName: to.name
        });
        return this.success(`The \`${from.name}\` tag has been renamed to \`${to.name}\`.`);
    }

    public async getRawTag(context: GuildCommandContext, tagName: string | undefined): Promise<string | { content: string; files: FileContent[]; } | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const response = this.info(`The raw code for \`${match.name}\` is:\n\`\`\`${match.lang ?? ''}\n${match.content}\n\`\`\``);
        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info(`The raw code for \`${match.name}\` is attached`),
                files: [
                    {
                        name: match.name + '.bbtag',
                        file: match.content
                    }
                ]
            };
    }

    public async listTags(context: GuildCommandContext, author?: string): Promise<string | undefined> {
        const args: Parameters<ClusterUtilities['displayPaged']> = [
            context.channel,
            context.author,
            ' tags',
            async (skip, take) => await context.database.tags.list(skip, take),
            async () => await context.database.tags.count(),
            100,
            ', '
        ];

        if (author !== undefined) {
            const result = await context.queryMember({ filter: author });
            if (result.state !== 'SUCCESS')
                return undefined;

            args[2] += ` made by **${humanize.fullName(result.value.user)}**`;
            args[3] = async (skip, take) => await context.database.tags.byAuthor(result.value.id, skip, take);
            args[4] = async () => await context.database.tags.byAuthorCount(result.value.id);
        }

        switch (await context.util.displayPaged(...args)) {
            case false: return this.error('No results found!');
            case true: return this.success('I hope you found what you were looking for!');
            case undefined: return undefined;
        }
    }

    public async searchTags(context: GuildCommandContext, query?: string): Promise<string | undefined> {
        if (query === undefined || query.length === 0) {
            const queryResult = await context.queryText({ prompt: 'What would you like to search for?' });
            if (queryResult.state !== 'SUCCESS')
                return undefined;

            query = queryResult.value;
        }
        if (query.length === 0)
            return undefined;

        const _query = query;
        const result = await context.util.displayPaged(
            context.channel,
            context.author,
            ` tags matching \`${query}\``,
            (skip, take) => context.database.tags.search(_query, skip, take),
            () => context.database.tags.searchCount(_query),
            100,
            ', ');

        switch (result) {
            case false: return this.error('No results found!');
            case true: return this.success('I hope you found what you were looking for!');
            case undefined: return undefined;
        }
    }

    public async disableTag(context: GuildCommandContext, tagName: string, reason: string): Promise<string | undefined> {
        tagName = normalizeName(tagName);
        if (!await context.database.tags.disable(tagName, context.author.id, reason))
            return this.error(`The \`${tagName}\` tag doesn't exist!`);
        return this.success(`The \`${tagName}\` tag has been deleted`);
    }

    public async setTagCooldown(context: GuildCommandContext, tagName: string, cooldown?: Duration): Promise<string | undefined> {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return this.error('The cooldown must be greater than 0ms');

        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        await context.database.tags.setProp(match.name, 'cooldown', cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return this.success(`The tag \`${match.name}\` now has a cooldown of \`${humanize.duration(cooldown)}\`.`);
    }

    public async getTagAuthor(context: GuildCommandContext, tagName: string | undefined): Promise<string | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const response = [];
        const author = await context.database.users.get(match.author);
        response.push(this.success(`The tag \`${match.name}\` was made by **${humanize.fullName(author)}**`));
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await context.database.users.get(match.authorizer);
            response.push(`and is authorized by **${humanize.fullName(authorizer)}**`);
        }

        return response.join(' ');
    }

    public async getTagInfo(context: GuildCommandContext, tagName: string | undefined): Promise<string | SendPayload | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const fields: EmbedField[] = [];
        const embed: EmbedOptions = {
            title: `__**Tag | ${match.name}**__`,
            fields: fields,
            color: 978212,
            timestamp: new Date(),
            footer: {
                text: humanize.fullName(context.author),
                icon_url: context.author.avatarURL
            }
        };

        const favouriteCount = Object.values(match.favourites ?? {}).filter(v => v).length;
        const author = await context.database.users.get(match.author);
        if (author !== undefined)
            embed.author = context.util.embedifyAuthor(author);

        fields.push({
            name: 'Author',
            value: `${humanize.fullName(author)} (${author?.userid ?? match.author})`,
            inline: true
        });

        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await context.database.users.get(match.authorizer);
            fields.push({
                name: 'Authorizer',
                value: `${humanize.fullName(authorizer)} (${authorizer?.userid ?? match.authorizer})`,
                inline: true
            });
        }

        if (match.cooldown !== undefined)
            fields.push({ name: 'Cooldown', value: humanize.duration(moment.duration(match.cooldown)), inline: true });

        fields.push({ name: 'Last modified', value: moment(match.lastmodified.valueOf()).format('LLLL'), inline: true });
        fields.push({ name: 'Used', value: `${match.uses} ${p(match.uses, 'time')}`, inline: true });
        fields.push({ name: 'Favourited', value: `${favouriteCount} ${p(favouriteCount, 'time')}`, inline: true });

        if (match.reports !== undefined && match.reports > 0)
            fields.push({ name: this.warning('Reported'), value: `${match.reports} ${p(match.reports, 'time')}`, inline: true });

        const flags = humanize.flags(match.flags ?? []);
        if (flags.length > 0)
            fields.push({ name: 'Flags', value: flags.join('\n') });

        return { embeds: [embed] };
    }

    public async getTopTags(context: GuildCommandContext): Promise<string> {
        const tags = await context.database.tags.top(10);
        const result = ['__Here are the top 10 tags:__'];
        let i = 1;
        for (const tag of tags) {
            const author = await context.database.users.get(tag.author);
            result.push(`**${i++}.** **${tag.name}** (**${humanize.fullName(author)}**) - used **${tag.uses} ${p(tag.uses, 'time')}**`);
        }
        return result.join('\n');
    }

    public async toggleFavouriteTag(context: GuildCommandContext, tagName: string): Promise<string | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const isFavourited = match.favourites?.[context.author.id] === true;
        await context.database.tags.setFavourite(match.name, context.author.id, isFavourited);
        return isFavourited
            ? this.success(`The \`${match.name}\` tag is now on your favourites list!\n\n`) +
            'Note: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\n' +
            'Any tag that claims otherwise is lying, and should be reported.'
            : this.success(`The \`${match.name}\` tag is no longer on your favourites list!`);
    }

    public async listFavouriteTags(context: GuildCommandContext): Promise<string> {
        const tags = await context.database.tags.getFavourites(context.author.id);
        if (tags.length === 0)
            return 'You have no favourite tags!';
        return `You have ${tags.length} favourite ${p(tags.length, 'tag')}. ${codeBlock(tags.join(', '), 'fix')}`;
    }

    public async reportTag(context: GuildCommandContext, tagName: string, reason: string | undefined): Promise<string | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const user = await context.database.users.get(context.author.id);
        if (user === undefined)
            return this.error('Sorry, you cannot report tags at this time. Please try again later!');

        if (user.reportblock !== undefined)
            return user.reportblock;

        if (reason?.length === 0) reason = undefined;
        if (reason === undefined) {
            if (user.reports?.[match.name] !== undefined) {
                await context.database.tags.incrementReports(match.name, -1);
                await context.database.users.setTagReport(context.author.id, match.name, undefined);
                return this.success(`The \`${match.name}\` tag is no longer being reported by you.`);
            }
            const reasonResult = await context.queryText({ prompt: 'Please provide a reason for your report:' });
            if (reasonResult.state !== 'SUCCESS')
                return;

            reason = reasonResult.value;
        }

        if (user.reports?.[match.name] !== undefined)
            await context.database.tags.incrementReports(match.name, 1);
        await context.database.users.setTagReport(context.author.id, match.name, reason);
        await context.send(context.config.discord.channels.tagreports,
            `**${humanize.fullName(context.author)}** has reported the tag: ${match.name}\n\n${reason}`);
        return this.success(`The \`${match.name}\` tag has been reported.`);
    }

    public async getTagFlags(context: GuildCommandContext, tagName: string): Promise<string | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const flags = humanize.flags(match.flags ?? []);
        if (flags.length === 0)
            return `The \`${match.name}\` tag has no flags.`;

        return `The \`${match.name}\` tag has the following flags:\n\n${flags.join('\n')}`;
    }

    public async addTagFlags(context: GuildCommandContext, tagName: string, flagsRaw: string): Promise<string | undefined> {
        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const [flag, args] of Object.entries(addFlags)) {
            if (args === undefined || args.length === 0)
                return this.error(`No word was specified for the \`${flag}\` flag`);

            if (flags.some(f => f.flag === flag))
                return this.error(`The flag \`${flag}\` already exists!`);

            const word = args.get(0)?.value.replace(/[^a-z]/gi, '').toLowerCase() ?? '';
            if (flags.some(f => f.word === word))
                return this.error(`A flag with the word \`${word}\` already exists!`);

            const description = args.slice(1).merge().value.replace(/\n/g, ' ');
            flags.push({ flag, word, description });
        }

        await context.database.tags.setProp(match.name, 'flags', flags);
        return this.success(`The flags for \`${match.name}\` have been updated.`);
    }

    public async removeTagFlags(context: GuildCommandContext, tagName: string, flagsRaw: string): Promise<string | undefined> {
        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const { _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []]
            .filter(f => removeFlags[f.flag] === undefined);

        await context.database.tags.setProp(match.name, 'flags', flags);
        return this.success(`The flags for \`${match.name}\` have been updated.`);
    }

    public async setTagLanguage(context: GuildCommandContext, tagName: string, language: string): Promise<string | undefined> {
        const match = await this.requestEditableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        await context.database.tags.setProp(match.name, 'lang', language);
        return this.success(`Lang for tag \`${match.name}\` set.`);
    }

    private async saveTag(context: GuildCommandContext, operation: string, tagName: string, content: string | undefined, oldTag?: StoredTag): Promise<string | undefined> {
        content = await this.requestTagContent(context, content);
        if (content === undefined)
            return;

        const analysis = context.bbtag.check(content);
        if (analysis.errors.length > 0)
            return this.error(`There were errors with the bbtag you provided!\n${bbtag.stringifyAnalysis(analysis)}`);

        await context.database.tags.set({
            name: tagName,
            author: context.author.id,
            authorizer: oldTag?.authorizer ?? context.author.id,
            content,
            lastmodified: new Date(),
            uses: oldTag?.uses ?? 0,
            flags: [...oldTag?.flags ?? []],
            lang: oldTag?.lang ?? ''
        });

        void this.logChange(context, oldTag !== undefined ? TagChangeAction.EDIT : TagChangeAction.CREATE, context.author, context.id, {
            tag: tagName,
            content
        });

        return this.success(`Tag \`${tagName}\` ${operation}.\n${bbtag.stringifyAnalysis(analysis)}`);
    }

    private async requestTagName(context: GuildCommandContext, name: string | undefined, query = 'Enter the name of the tag or type `c` to cancel:'): Promise<string | undefined> {
        if (name !== undefined) {
            name = normalizeName(name);
            if (name.length > 0)
                return name;
        }

        if (query.length === 0)
            return undefined;

        const nameResult = await context.queryText({ prompt: query });
        if (nameResult.state !== 'SUCCESS')
            return undefined;

        name = normalizeName(nameResult.value);
        return name.length > 0 ? name : undefined;
    }

    private async requestTagContent(context: GuildCommandContext, content: string | undefined): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        const contentResult = await context.queryText({ prompt: 'Enter the tag\'s contents:' });
        if (contentResult.state !== 'SUCCESS')
            return undefined;

        return contentResult.value;
    }

    private async requestSettableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; tag?: StoredTag; } | string | undefined> {
        const match = await this.requestTag(context, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (context.util.isBotOwner(context.author.id)
            && match.tag !== undefined
            && match.tag.author !== context.author.id) {
            return this.error(`You don't own the \`${match.name}\` tag!`);
        }

        return { name: match.name, tag: match.tag };
    }

    private async requestEditableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<StoredTag | string | undefined> {
        const match = await this.requestSettableTag(context, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return this.error(`The \`${match.name}\` tag doesn't exist!`);

        return match.tag;
    }

    private async requestReadableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<StoredTag | string | undefined> {
        const match = await this.requestTag(context, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return this.error(`The \`${match.name}\` tag doesn't exist!`);

        return match.tag;
    }

    private async requestCreatableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; } | string | undefined> {
        const match = await this.requestTag(context, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag !== undefined)
            return this.error(`The \`${match.name}\` tag already exists!`);

        return { name: match.name };
    }

    private async requestTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery: boolean
    ): Promise<{ name: string; tag?: StoredTag; } | string | undefined> {
        tagName = await this.requestTagName(context, tagName, allowQuery ? undefined : '');
        if (tagName === undefined)
            return;

        const tag = await context.database.tags.get(tagName);
        if (tag === undefined)
            return { name: tagName };
        if (tag.deleted === true) {
            let result: string = this.error(`The \`${tag.name}\` tag has been permanently deleted`);
            if (tag.deleter !== undefined) {
                const deleter = await context.database.users.get(tag.deleter);
                if (deleter !== undefined)
                    result += ` by **${humanize.fullName(deleter)}**`;
            }
            if (tag.reason !== undefined)
                result += `\n\nReason: ${tag.reason}`;
            return result;
        }

        return { name: tag.name, tag };
    }

    private async showDocs(ctx: GuildCommandContext, topic: string | undefined): Promise<SendPayload | string> {
        const embed = await getDocsEmbed(ctx, topic);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${ctx.prefix}${ctx.commandName} docs\` for a list of all topics`);
        if (typeof embed === 'string')
            return embed;
        return { embeds: [embed], isHelp: true };
    }

    private async logChange(
        context: CommandContext,
        action: TagChangeAction,
        user: User,
        messageId: string,
        details: Record<string, string>): Promise<void> {
        const files: FileContent[] = [];
        const fields: EmbedField[] = [];
        if ('tag' in details && 'content' in details)
            files.push({ name: details.tag + '.bbtag', file: details.content });

        for (const [key, detail] of Object.entries(details)) {
            fields.push({
                name: key,
                value: humanize.truncate(detail, 1000, '(too long)'),
                inline: true
            });
        }

        await context.send(context.config.discord.channels.taglog, {
            embeds: [
                {
                    title: action,
                    color: tagChangeActionColour[action],
                    fields,
                    author: {
                        name: humanize.fullName(user),
                        icon_url: user.avatarURL,
                        url: context.util.websiteLink(`user/${user.id}`)
                    },
                    timestamp: new Date(),
                    footer: {
                        text: `MsgID: ${messageId}`
                    }
                }
            ],
            files
        });
    }
}

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,/#!$%^&*;:{}[\]=\-_~()]/gi, '');
}

const enum TagChangeAction {
    CREATE = 'Create',
    RENAME = 'Rename',
    EDIT = 'Edit',
    DELETE = 'Delete'
}

const tagChangeActionColour: { [P in TagChangeAction]: number } = {
    [TagChangeAction.CREATE]: 0x0eed24,
    [TagChangeAction.RENAME]: 0x6b0eed,
    [TagChangeAction.EDIT]: 0xf20212,
    [TagChangeAction.DELETE]: 0x02f2ee
};
