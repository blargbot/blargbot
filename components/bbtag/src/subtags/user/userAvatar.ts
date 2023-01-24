import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userAvatar;

@Subtag.id('userAvatar')
@Subtag.factory(Subtag.util())
export class UserAvatarSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserAvatarUrl(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserAvatarUrl(ctx, userId.value, quiet.value !== '')
                }
            ]
        });

        this.#util = util;
    }

    public async getUserAvatarUrl(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });
        if (member !== undefined)
            return member.avatarURL;

        const user = await this.#util.getUser(userId);
        if (user !== undefined)
            return user.avatarURL;

        throw new UserNotFoundError(userId)
            .withDisplay(quiet ? '' : undefined);
    }
}
