import { EmbedField, EmbedOptions, Message, MessageFile, User } from 'eris';
import moment from 'moment';
import { Duration } from 'moment-timezone';
import { Cluster, ClusterUtilities } from '../cluster';
import { SendPayload } from '../core/BaseUtilities';
import { ExecutionResult, limits } from '../core/bbtag';
import { BaseCommand } from '../core/command';
import { StoredTag } from '../core/database';
import { bbtagUtil, codeBlock, commandTypes, guard, humanize, parse } from '../utils';

export class TagCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'tag',
            aliases: ['t'],
            category: commandTypes.GENERAL,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\n'
                + 'For more information about BBTag, visit <https://blargbot.xyz/tags>.\n'
                + 'By creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tags/tos>)',
            definition: {
                parameters: '{tagName} {args*}',
                execute: (msg, [tagName], _, raw) => this.runTag(msg, tagName, humanize.smartSplitSkip(raw, 1) ?? '', false),
                subcommands: {
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: (msg, [debug], _, raw) => this.runRaw(msg, humanize.smartSplitSkip(raw, debug === undefined ? 1 : 2) ?? '', '', debug !== undefined),
                        description: ''
                    },
                    'debug': {
                        parameters: '{tagName} {args*}',
                        execute: (msg, [tagName], _, raw) => this.runTag(msg, tagName, humanize.smartSplitSkip(raw, 2) ?? '', true),
                        description: ''
                    },
                    'create|add': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.createTag(msg, tagName, humanize.smartSplitSkip(raw, 2)),
                        description: 'Creates a new tag with the content you give'
                    },
                    'edit': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.editTag(msg, tagName, humanize.smartSplitSkip(raw, 2)),
                        description: 'Edits an existing tag to have the content you specify'
                    },
                    'set': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.setTag(msg, tagName, humanize.smartSplitSkip(raw, 2)),
                        description: 'Sets the tag to have the content you specify. If the tag doesnt exist it will be created.'
                    },
                    'delete|remove': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.deleteTag(msg, tagName),
                        description: 'Deletes an existing tag'
                    },
                    'rename': {
                        parameters: '{oldName?} {newName?}',
                        execute: (msg, [oldName, newName]) => this.renameTag(msg, oldName, newName),
                        description: 'Renames the tag'
                    },
                    'raw': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getRawTag(msg, tagName),
                        description: ''
                    },
                    'list': {
                        parameters: '{author*}',
                        execute: (msg, [author]) => this.listTags(msg, author.join('')),
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.searchTags(msg, tagName),
                        description: ''
                    },
                    'permdelete': {
                        parameters: '{tagName} {reason+}',
                        execute: (msg, [tagName, reason]) => this.disableTag(msg, tagName, reason.join(' ')),
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: (msg, [tagName, duration]) => this.setTagCooldown(msg, tagName, duration),
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getTagAuthor(msg, tagName),
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getTagInfo(msg, tagName),
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => this.getTopTags(),
                        description: ''
                    },
                    'favourite|favorite|favourites|favorites': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => typeof tagName === 'string'
                            ? this.toggleFavouriteTag(msg, tagName)
                            : this.listFavouriteTags(msg),
                        description: ''
                    },
                    'report': {
                        parameters: '{tagName} {reason*}',
                        execute: (msg, [tagName, reason]) => this.reportTag(msg, tagName, reason.join(' ')),
                        description: ''
                    },
                    'flag|flags': {
                        parameters: '{tagName}',
                        execute: (msg, [tagName]) => this.getTagFlags(msg, tagName),
                        description: 'Lists the flags the tag accepts',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {flags+}',
                                execute: (msg, [tagName, flags]) => this.addTagFlags(msg, tagName, flags),
                                description: 'Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                    'e.g. `b!t flags add mytag -c category The category you want to use -n name Your name`'
                            },
                            'delete|remove': {
                                parameters: '{tagName} {flags+}',
                                execute: (msg, [tagName, flags]) => this.removeTagFlags(msg, tagName, flags),
                                description: 'Removes multiple flags from your tag. Flags should be of the form `-<f>`\n' +
                                    'e.g. `b!t flags remove mytag -c -n`'
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: (msg, [tagName, language]) => this.setTagLanguage(msg, tagName, language),
                        description: ''
                    }
                }
            }
        });

    }

    public async runTag(
        message: Message,
        tagName: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string, files: MessageFile } | undefined> {
        if (!guard.isGuildMessage(message))
            return '❌ Tags can only be run on guilds.';

        const match = await this.requestReadableTag(message, tagName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== message.author.id)
            return '❌ You cannot debug someone elses tag.';

        await this.database.tags.incrementUses(match.name, 1);

        const args = humanize.smartSplit(input);
        const result = await this.cluster.bbtag.execute(match.content, {
            message: message,
            input: args,
            isCC: false,
            limit: new limits.TagLimit(),
            tagName: match.name,
            author: match.author,
            authorizer: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        return debug ? createDebugOutput(match.name, match.content, args, result) : undefined;
    }

    public async runRaw(
        message: Message,
        content: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string, files: MessageFile } | undefined> {
        if (!guard.isGuildMessage(message))
            return '❌ Tags can only be run on guilds.';

        const args = humanize.smartSplit(input);
        const result = await this.cluster.bbtag.execute(content, {
            message: message,
            input: args,
            isCC: false,
            limit: new limits.TagLimit(),
            tagName: 'test',
            author: message.author.id
        });

        return debug ? createDebugOutput('test', content, args, result) : undefined;
    }

    public async createTag(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestCreatableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        return await this.saveTag(message, 'set', match.name, content, undefined);
    }

    public async editTag(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        return await this.saveTag(message, 'set', match.name, content, match);
    }

    public async deleteTag(message: Message, tagName: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        await this.database.tags.delete(match.name);
        void this.logChange(TagChangeAction.DELETE, message.author, message.id, {
            author: `${(await this.database.users.get(match.author))?.username} (${match.author})`,
            tag: match.name,
            content: match.content
        });
        return `✅ The \`${match.name}\` tag is gone forever!`;
    }

    public async setTag(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestSettableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        return await this.saveTag(message, 'set', match.name, content, match.tag);
    }

    public async renameTag(message: Message, oldName: string | undefined, newName: string | undefined): Promise<string | undefined> {
        const from = await this.requestEditableTag(message, oldName);
        if (typeof from !== 'object')
            return from;

        const to = await this.requestCreatableTag(message, newName);
        if (typeof to !== 'object')
            return to;

        await this.database.tags.delete(from.name);
        await this.database.tags.add({
            ...from,
            name: to.name
        });

        void this.logChange(TagChangeAction.RENAME, message.author, message.id, {
            oldName: from.name,
            newName: to.name
        });
        return `✅ The \`${from.name}\` tag has been renamed to \`${to.name}\`.`;
    }

    public async getRawTag(message: Message, tagName: string | undefined): Promise<string | { content: string, files: MessageFile } | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const response = `The raw code for \`${match.name}\` is:\n\`\`\`${match.lang}\n${match.content}\n\`\`\``;
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

    public async listTags(message: Message, author?: string): Promise<string | undefined> {
        const args: Parameters<ClusterUtilities['displayPaged']> = [
            message.channel,
            message.author,
            ' tags',
            async (skip, take) => await this.database.tags.list(skip, take),
            async () => await this.database.tags.count(),
            100,
            ', '
        ];

        if (author) {
            const user = await this.util.getUser(message, author);
            if (!user)
                return;

            args[2] += ` made by **${humanize.fullName(user)}**`;
            args[3] = async (skip, take) => await this.database.tags.byAuthor(user.id, skip, take);
            args[4] = async () => await this.database.tags.byAuthorCount(user.id);
        }

        switch (await this.util.displayPaged(...args)) {
            case false: return '❌ No results found!';
            case true: return '✅ I hope you found what you were looking for!';
            case null: return undefined;
        }
    }

    public async searchTags(message: Message, query?: string): Promise<string | undefined> {
        if (query === undefined || query?.length === 0)
            query = (await this.util.awaitQuery(message.channel, message.author, 'What would you like to search for?'))?.content;
        if (query === undefined || query?.length === 0)
            return;

        const _query = query;
        const result = await this.util.displayPaged(
            message.channel,
            message.author,
            ` tags matching \`${query}\``,
            (skip, take) => this.database.tags.search(_query, skip, take),
            () => this.database.tags.searchCount(_query),
            100,
            ', ');

        switch (result) {
            case false: return '❌ No results found!';
            case true: return '✅ I hope you found what you were looking for!';
            case null: return undefined;
        }
    }

    public async disableTag(message: Message, tagName: string, reason: string): Promise<string | undefined> {
        tagName = normalizeName(tagName);
        if (!await this.database.tags.disable(tagName, message.author.id, reason))
            return `❌ The \`${tagName}\` tag doesn\'t exist!`;
        return `✅ The \`${tagName}\` tag has been deleted`;
    }

    public async setTagCooldown(message: Message, tagName: string, cooldown?: Duration): Promise<string | undefined> {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return '❌ The cooldown must be greater than 0ms';

        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        await this.database.tags.setCooldown(match.name, cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return `✅ The \`${match.name}\` now has a cooldown of \`${humanize.duration(cooldown)}\`.`;
    }

    public async getTagAuthor(message: Message, tagName: string | undefined): Promise<string | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const response = [];
        const author = await this.database.users.get(match.author);
        response.push(`The tag \`${match.name}\` was made by **${humanize.fullName(author)}**`);
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await this.database.users.get(match.authorizer);
            response.push(`and is authorized by **${humanize.fullName(authorizer)}**`);
        }

        return response.join(' ');
    }

    public async getTagInfo(message: Message, tagName: string | undefined): Promise<string | SendPayload | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const fields: EmbedField[] = [];
        const embed: EmbedOptions = {
            title: `__**Tag | ${match.name}**__`,
            fields: fields,
            color: 978212,
            timestamp: new Date(),
            footer: {
                text: humanize.fullName(message.author),
                icon_url: message.author.avatarURL
            }
        };

        const favouriteCount = Object.values(match.favourites ?? {}).filter(v => v).length;
        const author = await this.database.users.get(match.author);
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
            const authorizer = await this.database.users.get(match.authorizer);
            fields.push({
                name: 'Authorizer',
                value: `${humanize.fullName(authorizer)} (${authorizer?.userid ?? match.authorizer})`,
                inline: true
            });
        }

        if (match.cooldown !== undefined)
            fields.push({ name: 'Cooldown', value: humanize.duration(moment.duration(match.cooldown)), inline: true });

        fields.push({ name: 'Last modified', value: moment(match.lastmodified.valueOf()).format('LLLL'), inline: true });
        fields.push({ name: 'Used', value: `${match.uses} time${match.uses == 1 ? '' : 's'}`, inline: true });
        fields.push({ name: 'Favourited', value: `${favouriteCount} time${favouriteCount == 1 ? '' : 's'}`, inline: true });

        if (match.reports !== undefined && match.reports > 0)
            fields.push({ name: '⚠️ Reported ⚠️', value: `${match.reports} time${match.reports == 1 ? '' : 's'}`, inline: true });

        const flags = stringifyFlags(match);
        if (flags.length > 0)
            fields.push({ name: 'Flags', value: flags.join('\n') });

        return { embed };
    }

    public async getTopTags(): Promise<string> {
        const tags = await this.database.tags.top(10);
        const result = ['__Here are the top 10 tags:__'];
        let i = 1;
        for (const tag of tags) {
            const author = await this.database.users.get(tag.author);
            result.push(`**${i++}.** **${tag.name}** (**${humanize.fullName(author)}**) - used **${tag.uses} time${tag.uses === 1 ? '' : 's'}**`);
        }
        return result.join('\n');
    }

    public async toggleFavouriteTag(message: Message, tagName: string): Promise<string | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const isFavourited = !match.favourites?.[message.author.id];
        await this.database.tags.setFavourite(match.name, message.author.id, isFavourited);
        return isFavourited
            ? `✅ The \`${match.name}\` tag is now on your favourites list!\n\n` +
            'Note: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\n' +
            'Any tag that claims otherwise is lying, and should be reported.'
            : `✅ The \`${match.name}\` tag is no longer on your favourites list!`;
    }

    public async listFavouriteTags(message: Message): Promise<string> {
        const tags = await this.database.tags.getFavourites(message.author.id);
        if (tags.length === 0)
            return 'You have no favourite tags!';
        return `You have ${tags.length} favourite tag${tags.length === 1 ? '' : 's'}. ${codeBlock(tags.join(', '), 'fix')}`;
    }

    public async reportTag(message: Message, tagName: string, reason: string | undefined): Promise<string | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const user = await this.database.users.get(message.author.id);
        if (user === undefined)
            return '❌ Sorry, you cannot report tags at this time. Please try again later!';

        if (user.reportblock !== undefined)
            return user.reportblock;

        if (reason?.length === 0) reason = undefined;
        if (reason === undefined) {
            if (user.reports?.[match.name] !== undefined) {
                await this.database.tags.incrementReports(match.name, -1);
                await this.database.users.setTagReport(message.author.id, match.name, undefined);
                return `✅ The \`${match.name}\` tag is no longer being reported by you.`;
            }
            reason = (await this.util.awaitQuery(message.channel, message.author, 'Please provide a reason for your report or type `c` to cancel:'))?.content;
            if (reason === undefined || reason === 'c')
                return;
        }

        if (user.reports?.[match.name] !== undefined)
            await this.database.tags.incrementReports(match.name, 1);
        await this.database.users.setTagReport(message.author.id, match.name, reason);
        await this.util.send(this.config.discord.channels.tagreports,
            `**${humanize.fullName(message.author)}** has reported the tag: ${match.name}\n\n${reason}`);
        return `✅ The \`${match.name}\` tag has been reported.`;
    }

    public async getTagFlags(message: Message, tagName: string): Promise<string | undefined> {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        const flags = stringifyFlags(match);
        if (flags.length === 0)
            return `The \`${match.name}\` tag has no flags.`;

        return `The \`${match.name}\` tag has the following flags:\n\n${flags.join('\n')}`;
    }

    public async addTagFlags(message: Message, tagName: string, flagsRaw: string[]): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { undefined: _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...(match.flags ?? [])];
        for (const flag of Object.keys(addFlags)) {
            const args = addFlags[flag];
            if (args === undefined || args.length === 0)
                return `❌ No word was specified for the \`${flag}\` flag`;

            if (flags.some(f => f.flag === flag))
                return `❌ The flag \`${flag}\` already exists!`;

            const word = args[0].replace(/[^a-z]/g, '').toLowerCase();
            if (flags.some(f => f.word === word))
                return `❌ A flag with the word \`${word}\` already exists!`;

            const desc = args.slice(1).join(' ').replace(/\n/g, ' ');
            flags.push({ flag, word, desc });
        }

        await this.database.tags.setFlags(match.name, flags);
        return `✅ The flags for \`${match.name}\` have been updated.`;
    }

    public async removeTagFlags(message: Message, tagName: string, flagsRaw: string[]): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { undefined: _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...(match.flags ?? [])]
            .filter(f => removeFlags[f.flag] === undefined);

        await this.database.tags.setFlags(match.name, flags);
        return `✅ The flags for \`${match.name}\` have been updated.`;
    }

    public async setTagLanguage(message: Message, tagName: string, language: string): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        await this.database.tags.setLanguage(match.name, language);
        return `✅ Lang for tag \`${match.name}\` set.`;
    }

    private async saveTag(message: Message, operation: string, tagName: string, content: string | undefined, oldTag?: DeepReadOnly<StoredTag>): Promise<string | undefined> {
        content = await this.requestTagContent(message, content);
        if (content === undefined)
            return;

        const analysis = this.cluster.bbtag.check(content);
        if (analysis.errors.length > 0)
            return `❌ There were errors with the bbtag you provided!\n${bbtagUtil.stringifyAnalysis(analysis)}`;


        await this.database.tags.set({
            name: tagName,
            author: message.author.id,
            authorizer: oldTag?.authorizer ?? message.author.id,
            content,
            lastmodified: new Date(),
            uses: oldTag?.uses ?? 0,
            flags: [...oldTag?.flags ?? []],
            lang: oldTag?.lang ?? ''
        });

        void this.logChange(oldTag ? TagChangeAction.EDIT : TagChangeAction.CREATE, message.author, message.id, {
            tag: tagName,
            content
        });

        return `✅ Tag \`${tagName}\` ${operation}.\n${bbtagUtil.stringifyAnalysis(analysis)}`;
    }

    private async requestTagName(message: Message, name: string | undefined, query = 'Enter the name of the tag or type `c` to cancel:'): Promise<string | undefined> {
        if (name !== undefined) {
            name = normalizeName(name);
            if (name.length > 0)
                return name;
        }

        if (query.length === 0)
            return undefined;

        name = (await this.util.awaitQuery(message.channel, message.author, query))?.content;
        if (name === undefined || name === 'c')
            return undefined;

        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }

    private async requestTagContent(message: Message, content: string | undefined): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        content = (await this.util.awaitQuery(message.channel, message.author, 'Enter the tag\'s contents or type `c` to cancel:'))?.content;
        if (content === undefined || content === 'c')
            return undefined;

        return content.length > 0 ? content : undefined;
    }

    private async requestSettableTag(
        message: Message,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string, tag?: DeepReadOnly<StoredTag> } | string | undefined> {
        const match = await this.requestTag(message, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (message.author.id !== this.config.discord.users.owner
            && match.tag !== undefined
            && match.tag.author !== message.author.id) {
            return `❌ You don\'t own the \`${match.name}\` tag!`;
        }

        return { name: match.name, tag: match.tag };
    }

    private async requestEditableTag(
        message: Message,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<DeepReadOnly<StoredTag> | string | undefined> {
        const match = await this.requestSettableTag(message, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return `❌ The \`${match.name}\` tag doesn\'t exist!`;

        return match.tag;
    }

    private async requestReadableTag(
        message: Message,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<DeepReadOnly<StoredTag> | string | undefined> {
        const match = await this.requestTag(message, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return `❌ The \`${match.name}\` tag doesn\'t exist!`;

        return match.tag;
    }

    private async requestCreatableTag(
        message: Message,
        tagName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string } | string | undefined> {
        const match = await this.requestTag(message, tagName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.tag !== undefined)
            return `❌ The \`${match.name}\` tag already exists!`;

        return { name: match.name };
    }

    private async requestTag(
        message: Message,
        tagName: string | undefined,
        allowQuery: boolean
    ): Promise<{ name: string, tag?: DeepReadOnly<StoredTag> } | string | undefined> {
        tagName = await this.requestTagName(message, tagName, allowQuery ? undefined : '');
        if (tagName === undefined)
            return;

        const tag = await this.database.tags.get(tagName);
        if (tag === undefined)
            return { name: tagName };
        if (tag !== undefined && tag.deleted) {
            let result = `❌ The \`${tag.name}\` tag has been permanently deleted`;
            if (tag.deleter !== undefined) {
                const deleter = await this.database.users.get(tag.deleter);
                if (deleter !== undefined)
                    result += ` by **${humanize.fullName(deleter)}**`;
            }
            if (tag.reason)
                result += `\n\nReason: ${tag.reason}`;
            return result;
        }

        return { name: tag.name, tag };
    }

    private async logChange(
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

        await this.util.send(this.config.discord.channels.taglog, {
            embed: {
                title: action,
                color: tagChangeActionColour[action],
                fields,
                author: {
                    name: humanize.fullName(user),
                    icon_url: user.avatarURL,
                    url: `${this.config.website.secure ? 'https' : 'http'}://${this.config.website.host}/user/${user.id}`
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
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()]/gi, '');
}

function stringifyFlags(tag: DeepReadOnly<StoredTag>): string[] {
    return tag.flags?.map(flag =>
        `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc || 'No description.'}`
    ) ?? [];
}

function createDebugOutput(name: string, code: string, args: string[], result: ExecutionResult): { content: string, files: MessageFile } {
    const performance: Record<string, unknown> = {};
    for (const key of Object.keys(result.duration.subtag)) {
        const times = result.duration.subtag[key];
        if (times !== undefined && times.length > 0) {
            const totalTime = times.reduce((l, r) => l + r);
            performance[key] = {
                count: times.length,
                totalMs: totalTime,
                averageMs: totalTime / times.length,
                timesMs: times
            };
        }
    }

    return {
        content: codeBlock(
            `         Execution Time: ${humanize.duration(moment.duration(result.duration.active, 'ms'))}\n` +
            `    Variables Committed: ${result.database.committed}\n` +
            `Database Execution Time: ${humanize.duration(moment.duration(result.duration.database, 'ms'))}\n` +
            `   Total Execution Time: ${humanize.duration(moment.duration(result.duration.total, 'ms'))}`,
            'js'),
        files: {
            name: 'bbtag.debug.json',
            file: JSON.stringify({
                tagName: name,
                userInput: args,
                code: code,
                debug: result.debug,
                errors: result.errors,
                variables: result.database.values,
                performance: performance
            }, undefined, 2)
        }
    };
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