import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { QueryUserOptions } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import { isSnowflake } from '../../utils/snowflake.js';
import type { QueryEntityRequest, QueryEntityResponse } from '../types.js';

const tag = templates.subtags.userId;

export interface CheckMemberExistsFeature {
    checkMemberExists(guildId: string, userId: string): Promise<boolean>;
}
export interface CheckUserExistsFeature {
    checkUserExists(userId: string): Promise<boolean>;
}
export interface FindMemberFeature {
    findMember(guildId: string, searchText: string): Promise<string | undefined>;
}
export interface QueryMemberFeature {
    queryMember(request: QueryEntityRequest): Promise<QueryEntityResponse>;
}

type Features = CheckMemberExistsFeature & CheckUserExistsFeature & FindMemberFeature & QueryMemberFeature
export class UserIdSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userId',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.currentUser(ctx)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'id',
                    execute: (ctx, [userId, quiet]) => this.queryUser(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public currentUser(context: BBTagContext): string {
        return context.local.userId;
    }

    public async queryUser(context: BBTagContext, userStr: string, quiet: boolean): Promise<string> {
        return await this.query(context, userStr, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();
    }

    public static async query(context: BBTagContext, searchText: string, options?: QueryUserOptions): Promise<string | undefined> {
        return await context.subtags.get(UserIdSubtag).query(context, searchText, options);
    }

    public async query(context: BBTagContext, searchText: string, options?: QueryUserOptions): Promise<string | undefined> {
        if (searchText === '' || searchText === context.local.userId)
            return context.local.userId;

        const cached = context.root.queryCache.user.get(searchText.toLowerCase());
        if (cached !== undefined)
            return cached;

        if (isSnowflake(searchText)
            && await (options?.global === true
                ? this.#features.checkUserExists(searchText)
                : this.#features.checkMemberExists(context.root.guildId, searchText)
            )
        ) {
            return searchText;
        }

        if (options?.noLookup === true || context.local.quiet === true || context.root.queryCache.failedQueries >= 5) {
            const result = await this.#features.findMember(context.root.guildId, searchText);
            if (result !== undefined)
                context.root.queryCache.user.set(searchText.toLowerCase(), result);
            return result;
        }

        const result = await this.#features.queryMember({
            guildId: context.root.guildId,
            channelId: context.root.channelId,
            userId: context.root.userId,
            searchText: searchText,
            source: options?.noErrors !== true && context.local.noLookupErrors !== true
                ? `${context.root.isCC ? 'custom command' : 'tag'} \`${context.root.tagName}\``
                : undefined
        });
        if (result.success) {
            context.root.queryCache.user.set(searchText.toLowerCase(), result.id);
            return result.id;
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
