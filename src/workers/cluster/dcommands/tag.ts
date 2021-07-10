import { EmbedField, EmbedOptions, MessageFile, User } from 'eris';
import moment from 'moment';
import { Duration } from 'moment-timezone';
import { Cluster } from '../Cluster';
import { ClusterUtilities } from '../ClusterUtilities';
import { BaseGuildCommand, commandTypes, fafo, BBTagContext, bbtagUtil, GuildCommandContext, humanize, SendPayload, codeBlock, parse, StoredTag, getDocsEmbed, CommandContext, TagStoredEventOptions, TagV4StoredEventOptions, rules, TagLimit } from '../core';

export class TagCommand extends BaseGuildCommand {
    public constructor(cluster: Cluster) {
        super({
            name: 'tag',
            aliases: ['t'],
            category: commandTypes.GENERAL,
            description: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\n'
                + `For more information about BBTag, visit <${cluster.util.websiteLink('/tags')}>.\n`
                + `By creating a tag, you acknowledge that you agree to the Terms of Service (<${cluster.util.websiteLink('/tags/tos')}>)`,
            definition: {
                parameters: '{tagName} {~args+?}',
                execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName, args, false),
                description: 'Runs a user created tag with some arguments',
                subcommands: {
                    'test|eval|exec|vtest': {
                        parameters: '{~code+}',
                        execute: (ctx, [code]) => this.runRaw(ctx, code, '', false),
                        description: 'Uses the BBTag engine to execute the content as if it was a tag',
                        subcommands: {
                            'debug': {
                                parameters: '{~code+}',
                                execute: (ctx, [code]) => this.runRaw(ctx, code, '', true),
                                description: 'Uses the BBTag engine to execute the content as if it was a tag and will return the debug output'
                            }
                        }
                    },
                    'docs': {
                        parameters: '{topic+?}',
                        execute: (ctx, [topic]) => this.showDocs(ctx, topic),
                        description: 'Returns helpful information about the specified topic.'
                    },
                    'debug': {
                        parameters: '{tagName} {~args+?}',
                        execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName, args, true),
                        description: 'Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.'
                    },
                    'create|add': {
                        parameters: '{tagName?} {~content+?}',
                        execute: (ctx, [tagName, content]) => this.createTag(ctx, tagName, content),
                        description: 'Creates a new tag with the content you give'
                    },
                    'edit': {
                        parameters: '{tagName?} {~content+?}',
                        execute: (ctx, [tagName, content]) => this.editTag(ctx, tagName, content),
                        description: 'Edits an existing tag to have the content you specify'
                    },
                    'set': {
                        parameters: '{tagName?} {~content+?}',
                        execute: (ctx, [tagName, content]) => this.setTag(ctx, tagName, content),
                        description: 'Sets the tag to have the content you specify. If the tag doesnt exist it will be created.'
                    },
                    'delete|remove': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => this.deleteTag(ctx, tagName),
                        description: 'Deletes an existing tag'
                    },
                    'rename': {
                        parameters: '{oldName?} {newName?}',
                        execute: (ctx, [oldName, newName]) => this.renameTag(ctx, oldName, newName),
                        description: 'Renames the tag'
                    },
                    'raw': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => this.getRawTag(ctx, tagName),
                        description: 'Uses the BBTag engine to execute the content as it was a tag'
                    },
                    'list': {
                        parameters: '{author+?}',
                        execute: (ctx, [author]) => this.listTags(ctx, author.join('')),
                        description: 'Lists all tags, or tags made by a specific author'
                    },
                    'search': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => this.searchTags(ctx, tagName),
                        description: 'Searches for a tag based on the provided name'
                    },
                    'permdelete': {
                        parameters: '{tagName} {reason+}',
                        execute: (ctx, [tagName, reason]) => this.disableTag(ctx, tagName, reason.join(' ')),
                        description: 'Marks the tag name as deleted forever, so no one can ever use it'
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration:duration+=0ms}',
                        execute: (ctx, [tagName, duration]) => this.setTagCooldown(ctx, tagName, duration),
                        description: 'Sets the cooldown of a tag, in milliseconds'
                    },
                    'author': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => this.getTagAuthor(ctx, tagName),
                        description: 'Displays the name of the tag\'s author'
                    },
                    'info': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => this.getTagInfo(ctx, tagName),
                        description: 'Displays information about a tag'
                    },
                    'top': {
                        parameters: '',
                        execute: (ctx) => this.getTopTags(ctx),
                        description: 'Displays the top 5 tags'
                    },
                    'favourite|favorite|favourites|favorites': {
                        parameters: '{tagName?}',
                        execute: (ctx, [tagName]) => typeof tagName === 'string'
                            ? this.toggleFavouriteTag(ctx, tagName)
                            : this.listFavouriteTags(ctx),
                        description: 'Adds a tag to your favourite list, or displays your favourite tags'
                    },
                    'report': {
                        parameters: '{tagName} {reason+?}',
                        execute: (ctx, [tagName, reason]) => this.reportTag(ctx, tagName, reason.join(' ')),
                        description: 'Reports a tag as violating the ToS'
                    },
                    'flag|flags': {
                        parameters: '{tagName}',
                        execute: (ctx, [tagName]) => this.getTagFlags(ctx, tagName),
                        description: 'Lists the flags the tag accepts',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {~flags+}',
                                execute: (ctx, [tagName, flags]) => this.addTagFlags(ctx, tagName, flags),
                                description: 'Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                    'e.g. `b!t flags add mytag -c category The category you want to use -n name Your name`'
                            },
                            'delete|remove': {
                                parameters: '{tagName} {~flags+}',
                                execute: (ctx, [tagName, flags]) => this.removeTagFlags(ctx, tagName, flags),
                                description: 'Removes multiple flags from your tag. Flags should be of the form `-<f>`\n' +
                                    'e.g. `b!t flags remove mytag -c -n`'
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: (ctx, [tagName, language]) => this.setTagLanguage(ctx, tagName, language),
                        description: 'Sets the language to use when returning the raw text of your tag'
                    }
                }
            }
        });
        cluster.timeouts.on('tag', fafo(async event => {
            const migratedEvent = migrateEvent(event);
            if (migratedEvent === undefined)
                return;

            const context = await BBTagContext.deserialize(cluster.bbtag, migratedEvent.context);
            const source = bbtagUtil.parse(migratedEvent.content);
            context.limit.addRules(['timer', 'output'], rules.DisabledRule.instance);

            await cluster.bbtag.eval(source, context);
        }));
    }

    public async runTag(
        context: GuildCommandContext,
        tagName: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string; files: MessageFile; } | undefined> {
        const match = await this.requestReadableTag(context, tagName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== context.author.id)
            return this.error('You cannot debug someone elses tag.');

        await context.database.tags.incrementUses(match.name, 1);

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input,
            isCC: false,
            limit: new TagLimit(),
            tagName: match.name,
            author: match.author,
            authorizer: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        return debug ? bbtagUtil.createDebugOutput(match.name, match.content, input, result) : undefined;
    }

    public async runRaw(
        context: GuildCommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string; files: MessageFile; } | undefined> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: false,
            limit: new TagLimit(),
            tagName: 'test',
            author: context.author.id
        });

        return debug ? bbtagUtil.createDebugOutput('test', content, input, result) : undefined;
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

    public async getRawTag(context: GuildCommandContext, tagName: string | undefined): Promise<string | { content: string; files: MessageFile; } | undefined> {
        const match = await this.requestReadableTag(context, tagName);
        if (typeof match !== 'object')
            return match;

        const response = `The raw code for \`${match.name}\` is:\n\`\`\`${match.lang ?? ''}\n${match.content}\n\`\`\``;
        return response.length < 2000
            ? response
            : {
                content: `The raw code for \`${match.name}\` is attached`,
                files: {
                    name: match.name + '.bbtag',
                    file: match.content
                }
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
            const user = await context.util.getUser(context, author);
            if (user === undefined)
                return undefined;

            args[2] += ` made by **${humanize.fullName(user)}**`;
            args[3] = async (skip, take) => await context.database.tags.byAuthor(user.id, skip, take);
            args[4] = async () => await context.database.tags.byAuthorCount(user.id);
        }

        switch (await context.util.displayPaged(...args)) {
            case false: return this.error('No results found!');
            case true: return this.success('I hope you found what you were looking for!');
            case undefined: return undefined;
        }
    }

    public async searchTags(context: GuildCommandContext, query?: string): Promise<string | undefined> {
        if (query === undefined || query.length === 0)
            query = (await context.util.awaitQuery(context.channel, context.author, 'What would you like to search for?'))?.content;
        if (query === undefined || query.length === 0)
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
        embed.author = {
            name: humanize.fullName(author),
            icon_url: author?.avatarURL
        };

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
        fields.push({ name: 'Used', value: `${match.uses} time${match.uses === 1 ? '' : 's'}`, inline: true });
        fields.push({ name: 'Favourited', value: `${favouriteCount} time${favouriteCount === 1 ? '' : 's'}`, inline: true });

        if (match.reports !== undefined && match.reports > 0)
            fields.push({ name: this.warning('Reported'), value: `${match.reports} time${match.reports === 1 ? '' : 's'}`, inline: true });

        const flags = humanize.flags(match.flags ?? []);
        if (flags.length > 0)
            fields.push({ name: 'Flags', value: flags.join('\n') });

        return { embed };
    }

    public async getTopTags(context: GuildCommandContext): Promise<string> {
        const tags = await context.database.tags.top(10);
        const result = ['__Here are the top 10 tags:__'];
        let i = 1;
        for (const tag of tags) {
            const author = await context.database.users.get(tag.author);
            result.push(`**${i++}.** **${tag.name}** (**${humanize.fullName(author)}**) - used **${tag.uses} time${tag.uses === 1 ? '' : 's'}**`);
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
        return `You have ${tags.length} favourite tag${tags.length === 1 ? '' : 's'}. ${codeBlock(tags.join(', '), 'fix')}`;
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
            reason = (await context.util.awaitQuery(context.channel, context.author, 'Please provide a reason for your report or type `c` to cancel:'))?.content;
            if (reason === undefined || reason === 'c')
                return;
        }

        if (user.reports?.[match.name] !== undefined)
            await context.database.tags.incrementReports(match.name, 1);
        await context.database.users.setTagReport(context.author.id, match.name, reason);
        await context.util.send(context.config.discord.channels.tagreports,
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const flag of Object.keys(addFlags)) {
            const args = addFlags[flag];
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            return this.error(`There were errors with the bbtag you provided!\n${bbtagUtil.stringifyAnalysis(analysis)}`);

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

        return this.success(`Tag \`${tagName}\` ${operation}.\n${bbtagUtil.stringifyAnalysis(analysis)}`);
    }

    private async requestTagName(context: GuildCommandContext, name: string | undefined, query = 'Enter the name of the tag or type `c` to cancel:'): Promise<string | undefined> {
        if (name !== undefined) {
            name = normalizeName(name);
            if (name.length > 0)
                return name;
        }

        if (query.length === 0)
            return undefined;

        name = (await context.util.awaitQuery(context.channel, context.author, query))?.content;
        if (name === undefined || name === 'c')
            return undefined;

        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }

    private async requestTagContent(context: GuildCommandContext, content: string | undefined): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        content = (await context.util.awaitQuery(context.channel, context.author, 'Enter the tag\'s contents or type `c` to cancel:'))?.content;
        if (content === undefined || content === 'c')
            return undefined;

        return content.length > 0 ? content : undefined;
    }

    private async requestSettableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; tag?: StoredTag; } | string | undefined> {
        const match = await this.requestTag(context, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (context.author.id !== context.config.discord.users.owner
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
            let result = this.error(`The \`${tag.name}\` tag has been permanently deleted`);
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

    private showDocs(ctx: GuildCommandContext, topic: readonly string[]): SendPayload | string {
        const embed = getDocsEmbed(ctx, topic);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${ctx.prefix}${ctx.commandName} docs\` for a list of all topics`);

        return { embed: embed, isHelp: true };
    }

    private async logChange(
        context: CommandContext,
        action: TagChangeAction,
        user: User,
        messageId: string,
        details: Record<string, string>): Promise<void> {
        const files: MessageFile[] = [];
        const fields: EmbedField[] = [];
        if ('tag' in details && 'content' in details)
            files.push({ name: details.tag + '.bbtag', file: details.content });

        for (const key of Object.keys(details)) {
            fields.push({
                name: key,
                value: humanize.truncate(details[key], 1000, '(too long)'),
                inline: true
            });
        }

        await context.util.send(context.config.discord.channels.taglog, {
            embed: {
                title: action,
                color: tagChangeActionColour[action],
                fields,
                author: {
                    name: humanize.fullName(user),
                    icon_url: user.avatarURL,
                    url: `${context.config.website.secure ? 'https' : 'http'}://${context.config.website.host}/user/${user.id}`
                },
                timestamp: new Date(),
                footer: {
                    text: `MsgID: ${messageId}`
                }
            }
        }, files);
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

function migrateEvent<T extends TagStoredEventOptions>(event: T): TagV4StoredEventOptions | undefined {
    switch (event.version) {
        case undefined: // TODO actual migration
        case 0: return undefined;
        case 1: return undefined;
        case 2: return undefined;
        case 3: return undefined;
        case 4: return event;
    }
}
