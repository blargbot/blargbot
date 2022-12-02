import { bbtag } from '@blargbot/bbtag';
import { Cluster, ClusterUtilities } from '@blargbot/cluster';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, discord, parse } from '@blargbot/cluster/utils/index.js';
import { SendContent } from '@blargbot/core/types.js';
import { StoredTag } from '@blargbot/domain/models/index.js';
import { IFormattable, util } from '@blargbot/formatting';
import * as Eris from 'eris';
import moment from 'moment-timezone';
import fetch from 'node-fetch';

import { CommandContext, GuildCommand } from '../../command/index.js';
import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult.js';
import { BBTagDocumentationManager } from '../../managers/documentation/BBTagDocumentationManager.js';
import templates from '../../text.js';

const cmd = templates.commands.tag;

export class TagCommand extends GuildCommand {
    readonly #docs: BBTagDocumentationManager;

    public constructor(cluster: Cluster) {
        super({
            name: 'tag',
            aliases: ['t'],
            category: CommandType.GENERAL,
            description: cmd.description({ subtags: cluster.util.websiteLink('/bbtag'), tos: cluster.util.websiteLink('/bbtag/tos') }),
            definitions: [
                {
                    parameters: '{tagName} {~args+?}',
                    description: cmd.run.description,
                    execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName.asString, args.asOptionalString, false)
                },
                {
                    parameters: 'test|eval|exec|vtest',
                    subcommands: [
                        {
                            parameters: '{~code+}',
                            description: cmd.test.default.description,
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', false)
                        },
                        {
                            parameters: 'debug {~code+}',
                            description: cmd.test.debug.description,
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', true)
                        }
                    ]
                },
                {
                    parameters: 'docs {topic+?}',
                    description: cmd.docs.description,
                    execute: (ctx, [topic]) => this.#showDocs(ctx, topic.asOptionalString)
                },
                {
                    parameters: 'debug {tagName} {~args+?}',
                    description: cmd.debug.description,
                    execute: (ctx, [tagName, args]) => this.runTag(ctx, tagName.asString, args.asOptionalString, true)
                },
                {
                    parameters: 'create|add {tagName?} {~content+?}',
                    description: cmd.create.description,
                    execute: (ctx, [tagName, content]) => this.createTag(ctx, tagName.asOptionalString, content.asOptionalString)
                },
                {
                    parameters: 'edit {tagName?} {~content+?}',
                    description: cmd.edit.description,
                    execute: (ctx, [tagName, content]) => this.editTag(ctx, tagName.asOptionalString, content.asOptionalString)
                },
                {
                    parameters: 'set {tagName?} {~content+?}',
                    description: cmd.set.description,
                    execute: (ctx, [tagName, content]) => this.setTag(ctx, tagName.asOptionalString, content.asOptionalString)
                },
                {
                    parameters: 'delete|remove {tagName?}',
                    description: cmd.delete.description,
                    execute: (ctx, [tagName]) => this.deleteTag(ctx, tagName.asOptionalString)
                },
                {
                    parameters: 'rename {oldName?} {newName?}',
                    description: cmd.rename.description,
                    execute: (ctx, [oldName, newName]) => this.renameTag(ctx, oldName.asOptionalString, newName.asOptionalString)
                },
                {
                    parameters: 'raw {tagName?} {fileExtension:literal(bbtag|txt)=bbtag}',
                    description: cmd.raw.description,
                    execute: (ctx, [tagName, fileExtension]) => this.getRawTag(ctx, tagName.asOptionalString, fileExtension.asLiteral)
                },
                {
                    parameters: 'list {author+?}',
                    description: cmd.list.description,
                    execute: (ctx, [author]) => this.listTags(ctx, author.asOptionalString)
                },
                {
                    parameters: 'search {tagName?}',
                    description: cmd.search.description,
                    execute: (ctx, [tagName]) => this.searchTags(ctx, tagName.asOptionalString)
                },
                {
                    hidden: true,
                    parameters: 'permdelete {tagName} {reason+}',
                    description: cmd.permDelete.description,
                    execute: (ctx, [tagName, reason]) => this.disableTag(ctx, tagName.asString, reason.asString)
                },
                {
                    parameters: 'cooldown {tagName} {duration:duration+=0ms}',
                    description: cmd.cooldown.description,
                    execute: (ctx, [tagName, duration]) => this.setTagCooldown(ctx, tagName.asString, duration.asDuration)
                },
                {
                    parameters: 'author {tagName?}',
                    description: cmd.author.description,
                    execute: (ctx, [tagName]) => this.getTagAuthor(ctx, tagName.asOptionalString)
                },
                {
                    parameters: 'info {tagName?}',
                    description: cmd.info.description,
                    execute: (ctx, [tagName]) => this.getTagInfo(ctx, tagName.asOptionalString)
                },
                {
                    parameters: 'top ',
                    description: cmd.top.description,
                    execute: (ctx) => this.getTopTags(ctx)
                },
                {
                    parameters: 'report {tagName} {reason+?}',
                    description: cmd.report.description,
                    execute: (ctx, [tagName, reason]) => this.reportTag(ctx, tagName.asString, reason.asOptionalString)
                },
                {
                    parameters: 'setlang {tagName} {language}',
                    description: cmd.setLang.description,
                    execute: (ctx, [tagName, language]) => this.setTagLanguage(ctx, tagName.asString, language.asString)
                },
                {
                    parameters: 'favourite|favorite|favourites|favorites',
                    subcommands: [
                        {
                            parameters: '',
                            description: cmd.favourite.list.description,
                            execute: (ctx) => this.listFavouriteTags(ctx)
                        },
                        {
                            parameters: '{tagName}',
                            description: cmd.favourite.toggle.description,
                            execute: (ctx, [tagName]) => this.toggleFavouriteTag(ctx, tagName.asString)
                        }
                    ]
                },
                {
                    parameters: 'flag|flags',
                    subcommands: [
                        {
                            parameters: '{tagName}',
                            description: cmd.flag.list.description,
                            execute: (ctx, [tagName]) => this.getTagFlags(ctx, tagName.asString)
                        },
                        {
                            parameters: 'create|add {tagName} {~flags+}',
                            description: cmd.flag.create.description,
                            execute: (ctx, [tagName, flags]) => this.addTagFlags(ctx, tagName.asString, flags.asString)
                        },
                        {
                            parameters: 'delete|remove {tagName} {~flags+}',
                            description: cmd.flag.delete.description,
                            execute: (ctx, [tagName, flags]) => this.removeTagFlags(ctx, tagName.asString, flags.asString)
                        }
                    ]
                }
            ]
        });

        this.#docs = new BBTagDocumentationManager(cluster, 'tag');
        cluster.discord.on('interactionCreate', i => this.#docs.handleInteraction(i));
    }

    public async runTag(
        context: GuildCommandContext,
        tagName: string,
        input: string | undefined,
        debug: boolean
    ): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        if (debug && match.author !== context.author.id)
            return cmd.test.debug.tagNotOwned;

        await context.database.tags.incrementUses(match.name, 1);

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input ?? '',
            isCC: false,
            limit: 'tagLimit',
            rootTagName: match.name,
            authorId: match.author,
            authorizerId: match.author,
            flags: match.flags,
            cooldown: match.cooldown,
            prefix: context.prefix
        });

        if (!debug)
            return undefined;

        await context.send(context.author, bbtag.createDebugOutput(result));
        return cmd.common.debugInDm;
    }

    public async runRaw(
        context: GuildCommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<CommandResult> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: false,
            limit: 'tagLimit',
            rootTagName: 'test',
            authorId: context.author.id,
            prefix: context.prefix
        });

        if (!debug)
            return undefined;

        await context.send(context.author, bbtag.createDebugOutput(result));
        return cmd.common.debugInDm;
    }

    public async createTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestCreatableTag(context, tagName);
        if ('response' in match)
            return match.response;

        return await this.#saveTag(context, cmd.create.success, match.name, content, undefined);
    }

    public async editTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;
        if (content === undefined) {
            if (context.message.attachments.length > 0) {
                const firstAttachment = context.message.attachments[0];
                if (firstAttachment.filename.endsWith('.bbtag') || firstAttachment.filename.endsWith('.txt'))
                    content = await (await fetch(firstAttachment.url)).text();
            }
        }

        return await this.#saveTag(context, cmd.edit.success, match.name, content, match);
    }

    public async deleteTag(context: GuildCommandContext, tagName: string | undefined): Promise<CommandResult> {
        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;

        await context.database.tags.delete(match.name);
        void this.#logChange(context, TagChangeAction.DELETE, context.author, context.id, {
            author: `${(await context.database.users.get(match.author))?.username ?? 'undefined'} (${match.author})`,
            tag: match.name,
            content: match.content
        });
        return cmd.delete.success({ name: match.name });
    }

    public async setTag(context: GuildCommandContext, tagName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestSettableTag(context, tagName);
        if ('response' in match)
            return match.response;
        if (content === undefined) {
            if (context.message.attachments.length > 0) {
                const firstAttachment = context.message.attachments[0];
                if (firstAttachment.filename.endsWith('.bbtag') || firstAttachment.filename.endsWith('.txt'))
                    content = await (await fetch(firstAttachment.url)).text();
            }
        }
        return await this.#saveTag(context, cmd.set.success, match.name, content, match.tag);
    }

    public async renameTag(context: GuildCommandContext, oldName: string | undefined, newName: string | undefined): Promise<CommandResult> {
        const from = await this.#requestEditableTag(context, oldName);
        if ('response' in from)
            return from.response;

        const to = await this.#requestCreatableTag(context, newName);
        if ('response' in to)
            return to.response;

        await context.database.tags.delete(from.name);
        await context.database.tags.add({
            ...from,
            name: to.name
        });

        void this.#logChange(context, TagChangeAction.RENAME, context.author, context.id, {
            oldName: from.name,
            newName: to.name
        });
        return cmd.rename.success({ oldName: from.name, newName: to.name });
    }

    public async getRawTag(context: GuildCommandContext, tagName: string | undefined, fileExtension: string): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        return new RawBBTagCommandResult(
            cmd.raw.inline({ name: match.name, content: match.content }),
            cmd.raw.attached({ name: match.name }),
            match.content,
            `${match.name}.${fileExtension}`
        );
    }

    public async listTags(context: GuildCommandContext, author?: string): Promise<CommandResult> {
        let pages: Parameters<ClusterUtilities['displayPaged']>[2];
        if (author !== undefined) {
            const result = await context.queryUser({ filter: author });
            if (result.state !== 'SUCCESS')
                return undefined;

            pages = async (page) => {
                const [total, tags] = await Promise.all([
                    context.database.tags.byAuthorCount(result.value.id),
                    context.database.tags.byAuthor(result.value.id, page * 100, 100)
                ]);
                return {
                    content: cmd.list.page.content({ tags }),
                    pageCount: Math.ceil(total / 100),
                    header: cmd.list.page.header.byUser({ count: tags.length, total: total, user: result.value })
                };
            };
        } else {
            pages = async (page) => {
                const [total, tags] = await Promise.all([
                    context.database.tags.count(),
                    context.database.tags.list(page * 100, 100)
                ]);
                return {
                    content: cmd.list.page.content({ tags }),
                    pageCount: Math.ceil(total / 100),
                    header: cmd.list.page.header.all({ count: tags.length, total: total })
                };
            };
        }

        switch (await context.util.displayPaged(context.channel, context.author, pages)) {
            case false: return cmd.errors.noneFound;
            case true: return cmd.common.done;
            case undefined: return undefined;
        }
    }

    public async searchTags(context: GuildCommandContext, query?: string): Promise<CommandResult> {
        if (query === undefined || query.length === 0) {
            const queryResult = await context.queryText({ prompt: cmd.search.query.prompt });
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
            async (page) => {
                const [total, tags] = await Promise.all([
                    context.database.tags.searchCount(_query),
                    context.database.tags.search(_query, page * 100, 100)
                ]);
                return {
                    content: cmd.search.page.content({ tags }),
                    pageCount: Math.ceil(total / 100),
                    header: cmd.search.page.header({ count: tags.length, total: total, query: _query })
                };
            });

        switch (result) {
            case false: return cmd.errors.noneFound;
            case true: return cmd.common.done;
            case undefined: return undefined;
        }
    }

    public async disableTag(context: GuildCommandContext, tagName: string, reason: string): Promise<CommandResult> {
        if (!context.util.isBotStaff(context.author.id))
            return cmd.permDelete.notStaff;

        tagName = normalizeName(tagName);
        if (!await context.database.tags.disable(tagName, context.author.id, reason))
            return cmd.errors.tagMissing({ name: tagName });
        return cmd.permDelete.success({ name: tagName });
    }

    public async setTagCooldown(context: GuildCommandContext, tagName: string, cooldown?: moment.Duration): Promise<CommandResult> {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return cmd.cooldown.cooldownZero;

        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;

        await context.database.tags.setProp(match.name, 'cooldown', cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return cmd.cooldown.success({ name: match.name, cooldown });
    }

    public async getTagAuthor(context: GuildCommandContext, tagName: string | undefined): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const author = await context.database.users.get(match.author);
        return cmd.author.success({ name: match.name, author });
    }

    public async getTagInfo(context: GuildCommandContext, tagName: string | undefined): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const author = await context.database.users.get(match.author);
        return {
            embeds: [
                {
                    title: cmd.info.embed.title({ name: match.name }),
                    color: 978212,
                    timestamp: new Date(),
                    author: author === undefined ? undefined : context.util.embedifyAuthor(author),
                    footer: {
                        text: cmd.info.embed.footer.text({ user: context.author }),
                        icon_url: context.author.avatarURL
                    },
                    fields: [
                        {
                            name: cmd.info.embed.field.author.name,
                            value: cmd.info.embed.field.author.value({ user: author ?? {}, id: author?.userid ?? match.author }),
                            inline: true
                        },
                        ...match.cooldown === undefined ? [] : [{
                            name: cmd.info.embed.field.cooldown.name,
                            value: cmd.info.embed.field.cooldown.value({ cooldown: moment.duration(match.cooldown) }),
                            inline: true
                        }],
                        {
                            name: cmd.info.embed.field.lastModified.name,
                            value: cmd.info.embed.field.lastModified.value({ lastModified: moment(match.lastmodified) }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.usage.name,
                            value: cmd.info.embed.field.usage.value({ count: match.uses }),
                            inline: true
                        },
                        {
                            name: cmd.info.embed.field.favourited.name,
                            value: cmd.info.embed.field.favourited.value({ count: Object.values(match.favourites ?? {}).filter(v => v).length }),
                            inline: true
                        },
                        ...match.reports === undefined || match.reports === 0 ? [] : [{
                            name: cmd.info.embed.field.reported.name,
                            value: cmd.info.embed.field.reported.value({ count: match.reports }),
                            inline: true
                        }],
                        ...match.flags === undefined || match.flags.length === 0 ? [] : [{
                            name: cmd.info.embed.field.flags.name,
                            value: cmd.info.embed.field.flags.value({ flags: match.flags }),
                            inline: true
                        }]
                    ]
                }
            ]
        };
    }

    public async getTopTags(context: GuildCommandContext): Promise<CommandResult> {
        const tags = await context.database.tags.top(10);
        return cmd.top.success({
            tags: await Promise.all(tags.map(async (tag, i) => ({
                author: await context.database.users.get(tag.author) ?? {},
                index: i + 1,
                name: tag.name,
                count: tag.uses
            })))
        });
    }

    public async toggleFavouriteTag(context: GuildCommandContext, tagName: string): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const isFavourited = match.favourites?.[context.author.id] === true;
        await context.database.tags.setFavourite(match.name, context.author.id, isFavourited);
        return cmd.favourite.toggle[isFavourited ? 'added' : 'removed']({ name: match.name });
    }

    public async listFavouriteTags(context: GuildCommandContext): Promise<CommandResult> {
        const tags = await context.database.tags.getFavourites(context.author.id);
        return cmd.favourite.list.success({ tags });
    }

    public async reportTag(context: GuildCommandContext, tagName: string, reason: string | undefined): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const user = await context.database.users.get(context.author.id);
        if (user === undefined)
            return cmd.report.unavailable;

        if (user.reportblock !== undefined)
            return cmd.report.blocked({ reason: user.reportblock });

        if (reason?.length === 0) reason = undefined;
        if (reason === undefined) {
            if (user.reports?.[match.name] !== undefined) {
                await context.database.tags.incrementReports(match.name, -1);
                await context.database.users.setTagReport(context.author.id, match.name, undefined);
                return cmd.report.deleted({ name: match.name });
            }
            const reasonResult = await context.queryText({ prompt: cmd.report.query.prompt });
            if (reasonResult.state !== 'SUCCESS')
                return;

            reason = reasonResult.value;
        }

        if (user.reports?.[match.name] !== undefined)
            await context.database.tags.incrementReports(match.name, 1);
        await context.database.users.setTagReport(context.author.id, match.name, reason);
        await context.send(context.config.discord.channels.tagreports, cmd.report.notification({ name: match.name, user: context.author, reason }));
        return cmd.report.added({ name: match.name });
    }

    public async getTagFlags(context: GuildCommandContext, tagName: string): Promise<CommandResult> {
        const match = await this.#requestReadableTag(context, tagName);
        if ('response' in match)
            return match.response;

        if (match.flags === undefined || match.flags.length === 0)
            return cmd.flag.list.none({ name: match.name });

        return cmd.flag.list.success({ name: match.name, flags: match.flags });
    }

    public async addTagFlags(context: GuildCommandContext, tagName: string, flagsRaw: string): Promise<CommandResult> {
        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const [flag, args] of Object.entries(addFlags)) {
            if (args === undefined || args.length === 0)
                return cmd.flag.create.wordMissing({ flag });

            if (flags.some(f => f.flag === flag))
                return cmd.flag.create.flagExists({ flag });

            const word = args.get(0)?.value.replace(/[^a-z]/gi, '').toLowerCase() ?? '';
            if (flags.some(f => f.word === word))
                return cmd.flag.create.wordExists({ word });

            const description = args.slice(1).merge().value.replace(/\n/g, ' ');
            flags.push({ flag, word, description });
        }

        await context.database.tags.setProp(match.name, 'flags', flags);
        return cmd.flag.updated({ name: match.name });
    }

    public async removeTagFlags(context: GuildCommandContext, tagName: string, flagsRaw: string): Promise<CommandResult> {
        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;

        const { _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []]
            .filter(f => removeFlags[f.flag] === undefined);

        await context.database.tags.setProp(match.name, 'flags', flags);
        return cmd.flag.updated({ name: match.name });
    }

    public async setTagLanguage(context: GuildCommandContext, tagName: string, language: string): Promise<CommandResult> {
        const match = await this.#requestEditableTag(context, tagName);
        if ('response' in match)
            return match.response;

        await context.database.tags.setProp(match.name, 'lang', language);
        return cmd.setLang.success({ name: match.name });
    }

    async #saveTag(context: GuildCommandContext, success: (value: { name: string; errors: Iterable<IFormattable<string>>; }) => CommandResult, tagName: string, content: string | undefined, oldTag?: StoredTag): Promise<CommandResult> {
        content = await this.#requestTagContent(context, content);
        if (content === undefined)
            return;

        const analysis = context.bbtag.check(content);
        const errors = [];
        for (const error of analysis.errors)
            errors.push(cmd.errors.bbtagError(error));
        for (const warning of analysis.warnings)
            errors.push(cmd.errors.bbtagWarning(warning));

        if (analysis.errors.length > 0)
            return cmd.errors.invalidBBTag({ errors });

        await context.database.tags.set({
            name: tagName,
            author: context.author.id,
            content,
            lastmodified: new Date(),
            uses: oldTag?.uses ?? 0,
            flags: [...oldTag?.flags ?? []],
            lang: oldTag?.lang ?? ''
        });

        void this.#logChange(context, oldTag !== undefined ? TagChangeAction.EDIT : TagChangeAction.CREATE, context.author, context.id, {
            tag: tagName,
            content
        });

        return success({ name: tagName, errors });
    }

    async #requestTagName(
        context: GuildCommandContext,
        name: string | undefined,
        query: IFormattable<string> = cmd.request.name): Promise<string | undefined> {
        if (name === undefined) {
            const nameResult = await context.queryText({ prompt: query });
            if (nameResult.state !== 'SUCCESS')
                return undefined;

            name = nameResult.value;
        }

        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }

    async #requestTagContent(context: GuildCommandContext, content: string | undefined): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        const contentResult = await context.queryText({ prompt: cmd.request.content });
        if (contentResult.state !== 'SUCCESS')
            return undefined;

        return contentResult.value;
    }

    async #requestSettableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; tag?: StoredTag; } | { response: CommandResult; }> {
        const match = await this.#requestTag(context, tagName, query);
        if ('response' in match)
            return match;

        if (match.tag !== undefined
            && match.tag.author !== context.author.id
            && !(context.util.isBotStaff(context.author.id) && await context.queryConfirm({
                prompt: cmd.permDelete.confirm.prompt({ name: match.name }),
                continue: cmd.permDelete.confirm.continue,
                cancel: cmd.permDelete.confirm.cancel,
                fallback: false
            }))) {
            return { response: cmd.errors.notOwner({ name: match.name }) };
        }

        return { name: match.name, tag: match.tag };
    }

    async #requestEditableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        query?: IFormattable<string>
    ): Promise<StoredTag | { response: CommandResult; }> {
        const match = await this.#requestSettableTag(context, tagName, query);
        if ('response' in match)
            return match;

        if (match.tag === undefined)
            return { response: cmd.errors.tagMissing({ name: match.name }) };

        return match.tag;
    }

    async #requestReadableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        query?: IFormattable<string>
    ): Promise<StoredTag | { response: CommandResult; }> {
        const match = await this.#requestTag(context, tagName, query);
        if ('response' in match)
            return match;

        if (match.tag === undefined)
            return { response: cmd.errors.tagMissing({ name: match.name }) };

        return match.tag;
    }

    async #requestCreatableTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; } | { response: CommandResult; }> {
        const match = await this.#requestTag(context, tagName, query);
        if ('response' in match)
            return match;

        if (match.tag !== undefined)
            return { response: cmd.errors.alreadyExists({ name: match.name }) };

        return { name: match.name };
    }

    async #requestTag(
        context: GuildCommandContext,
        tagName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; tag?: StoredTag; } | { response: CommandResult; }> {
        tagName = await this.#requestTagName(context, tagName, query);
        if (tagName === undefined)
            return { response: undefined };

        const tag = await context.database.tags.get(tagName);
        if (tag === undefined)
            return { name: tagName };
        if (tag.deleted === true) {
            const deleter = tag.deleter !== undefined ? await context.database.users.get(tag.deleter) : undefined;
            return { response: cmd.errors.deleted({ name: tag.name, reason: tag.reason, user: deleter }) };
        }

        return { name: tag.name, tag };
    }

    async #showDocs(ctx: GuildCommandContext, topic: string | undefined): Promise<SendContent<IFormattable<string>>> {
        return await this.#docs.createMessageContent(topic ?? '', ctx.author, ctx.channel);
    }

    async #logChange(
        context: CommandContext,
        action: TagChangeAction,
        user: Eris.User,
        messageId: string,
        details: Record<string, string>): Promise<void> {
        await context.send(context.config.discord.channels.taglog, {
            embeds: [
                {
                    title: util.literal(action),
                    color: tagChangeActionColour[action],
                    fields: Object.entries(details).map(([key, detail]) => ({
                        name: util.literal(key),
                        value: util.literal(discord.overflowText('embed.field.value', detail, '(too long)')),
                        inline: true
                    })),
                    author: {
                        name: util.literal(`${user.username}#${user.discriminator}`),
                        icon_url: user.avatarURL,
                        url: `https://discord.com/users/${user.id}`
                    },
                    timestamp: new Date(),
                    footer: {
                        text: util.literal(`MsgID: ${messageId}`)
                    }
                }
            ],
            file: [
                ...'tag' in details && 'content' in details ? [{
                    name: `${details.tag}.bbtag`,
                    file: details.content
                }] : []
            ]
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
