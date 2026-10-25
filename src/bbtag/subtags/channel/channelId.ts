import { snowflake } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { QueryEntityOptions } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';

const tag = templates.subtags.channelId;

export type QueryChannelResult = ApiResult<{ channelId: string; }, { cause: 'notFound' | 'aborted'; }>;

export interface QueryChannelOptions {
    readonly guildId: string;
    readonly channelId: string;
    readonly userId: string;
    readonly searchText: string;
    readonly source?: string;
}

export interface CheckChannelExistsThunk {
    (guildId: string, channelId: string): Promise<boolean>;
}
export interface FindChannelThunk {
    (guildId: string, searchText: string): Promise<string | undefined>;
}
export interface QueryChannelThunk {
    (options: QueryChannelOptions): Promise<QueryChannelResult>;
}

export class ChannelIdSubtag extends CompiledSubtag {
    readonly #checkChannelExists: CheckChannelExistsThunk;
    readonly #findChannel: FindChannelThunk;
    readonly #queryChannel: QueryChannelThunk;
    public constructor({ checkChannelExists, findChannel, queryChannel }: {
        checkChannelExists: CheckChannelExistsThunk;
        findChannel: FindChannelThunk;
        queryChannel: QueryChannelThunk;
    }) {
        super({
            name: 'channelId',
            aliases: ['categoryId'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
        this.#checkChannelExists = checkChannelExists;
        this.#findChannel = findChannel;
        this.#queryChannel = queryChannel;
    }

    public currentChannel(context: BBTagContext): string {
        return context.local.message.channel.id;
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string> {
        return await this.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
    }

    public static async query(context: BBTagContext, searchText: string, options?: QueryEntityOptions): Promise<string | undefined> {
        return await context.engine.getSubtag(ChannelIdSubtag).query(context, searchText, options);
    }

    public async query(context: BBTagContext, searchText: string, options?: QueryEntityOptions): Promise<string | undefined> {
        if (searchText === '' || searchText === context.local.message.channel.id)
            return context.local.message.channel.id;

        const cached = context.root.queryCache.channel.get(searchText.toLowerCase());
        if (cached !== undefined)
            return cached;

        if (snowflake.test(searchText) && await this.#checkChannelExists(context.root.guildId, searchText))
            return searchText;

        if (options?.noLookup === true || context.local.quiet === true || context.root.queryCache.failedQueries >= 5) {
            const result = await this.#findChannel(context.root.guildId, searchText);
            if (result !== undefined)
                context.root.queryCache.channel.set(searchText.toLowerCase(), result);
            return result;
        }

        const result = await this.#queryChannel({
            guildId: context.root.guildId,
            channelId: context.root.message.channel.id,
            userId: context.root.message.author.id,
            searchText: searchText,
            source: options?.noErrors !== true && context.local.noLookupErrors !== true
                ? `${context.root.isCC ? 'custom command' : 'tag'} \`${context.root.tagName}\``
                : undefined
        });
        if (result.success) {
            context.root.queryCache.channel.set(searchText.toLowerCase(), result.channelId);
            return result.channelId;
        }

        switch (result.cause) {
            case 'aborted':
                context.root.queryCache.failedQueries = Infinity;
                break;
            case 'notFound':
                context.root.queryCache.failedQueries++;
                break;
        }

        return undefined;
    }
}
