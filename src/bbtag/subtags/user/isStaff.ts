import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.isStaff;

export interface IsUserStaffThunk {
    (guildId: string, userId: string): Promise<boolean>;
}

export class IsStaffSubtag extends CompiledSubtag {
    readonly #isUserStaff: IsUserStaffThunk;
    readonly #cache = new WeakMap<BBTagContext, Map<string, Promise<boolean>>>();
    public constructor({ isUserStaff }: { isUserStaff: IsUserStaffThunk; }) {
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
        this.#isUserStaff = isUserStaff;
    }

    public static async isStaff(context: BBTagContext, userId?: string): Promise<boolean> {
        return await context.engine.getSubtag(IsStaffSubtag).isStaff(context, userId);
    }

    public async isStaff(context: BBTagContext, userId?: string): Promise<boolean> {
        userId ??= context.root.authorizer?.id;
        return userId !== undefined
            && await this.#cache.getOrInsertComputed(context, () => new Map())
                .getOrInsertComputed(userId, id => this.#isUserStaff(context.root.guildId, id));
    }

    public async isStaffLookup(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return await this.isStaff(context, member.id);
    }
}
