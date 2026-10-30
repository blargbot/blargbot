import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { QueryEntityOptions } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import { isSnowflake } from '../../utils/snowflake.js';
import type { QueryEntityRequest, QueryEntityResponse } from '../types.js';

const tag = templates.subtags.roleId;

export interface CheckRoleExistsFeature {
    checkRoleExists(guildId: string, roleId: string): Promise<boolean>;
}
export interface FindRoleFeature {
    findRole(guildId: string, searchText: string): Promise<string | undefined>;
}
export interface QueryRoleFeature {
    queryRole(request: QueryEntityRequest): Promise<QueryEntityResponse>;
}

type Features = CheckRoleExistsFeature & FindRoleFeature & QueryRoleFeature;
export class RoleIdSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleId',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [role, quiet]) => this.queryRole(ctx, role.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async queryRole(context: BBTagContext, roleStr: string, quiet: boolean): Promise<string> {
        return await this.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();
    }

    public static async query(context: BBTagContext, searchText: string, options?: QueryEntityOptions): Promise<string | undefined> {
        return await context.subtags.get(RoleIdSubtag).query(context, searchText, options);
    }

    public async query(context: BBTagContext, searchText: string, options?: QueryEntityOptions): Promise<string | undefined> {
        const cached = context.root.queryCache.role.get(searchText.toLowerCase());
        if (cached !== undefined)
            return cached;

        if (isSnowflake(searchText) && await this.#features.checkRoleExists(context.root.guildId, searchText))
            return searchText;

        if (options?.noLookup === true || context.local.quiet === true || context.root.queryCache.failedQueries >= 5) {
            const result = await this.#features.findRole(context.root.guildId, searchText);
            if (result !== undefined)
                context.root.queryCache.role.set(searchText.toLowerCase(), result);
            return result;
        }

        const result = await this.#features.queryRole({
            guildId: context.root.guildId,
            channelId: context.root.channelId,
            userId: context.root.userId,
            searchText: searchText,
            source: options?.noErrors !== true && context.local.noLookupErrors !== true
                ? `${context.root.isCC ? 'custom command' : 'tag'} \`${context.root.tagName}\``
                : undefined
        });
        if (result.success) {
            context.root.queryCache.role.set(searchText.toLowerCase(), result.id);
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
