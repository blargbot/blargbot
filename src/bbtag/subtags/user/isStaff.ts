import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.isStaff;

export interface IsUserStaffFeature {
    isUserStaff(guildId: string, userId: string): Promise<boolean>;
}

type Features = IsUserStaffFeature
export class IsStaffSubtag extends CompiledSubtag {
    readonly #cache = new WeakMap<BBTagContext, Map<string, Promise<boolean>>>();
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'isStaff',
            aliases: ['isMod'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: ctx => this.isStaff(ctx)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user, quiet]) => this.isStaffLookup(ctx, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public static async isStaff(context: BBTagContext, userId?: string): Promise<boolean> {
        return await context.engine.getSubtag(IsStaffSubtag).isStaff(context, userId);
    }

    public async isStaff(context: BBTagContext, userId?: string): Promise<boolean> {
        userId ??= context.root.authorizerId;
        return await this.#cache.getOrInsertComputed(context, () => new Map())
            .getOrInsertComputed(userId, id => this.#features.isUserStaff(context.root.guildId, id));
    }

    public async isStaffLookup(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.isStaff(context, userId);
    }
}
