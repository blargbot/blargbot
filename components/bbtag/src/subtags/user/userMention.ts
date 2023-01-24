import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userMention;

@Subtag.id('userMention')
@Subtag.factory(Subtag.converter())
export class UserMentionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.userMention(ctx, ctx.user.id, false, 'false')
                },
                {
                    parameters: ['user', 'quiet?', 'noPing?:false'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet, noPing]) => this.userMention(ctx, userId.value, quiet.value !== '', noPing.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public async userMention(
        context: BBTagContext,
        userId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const noPing = this.#converter.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        if (!noPing && !context.data.allowedMentions.users.includes(user.id))
            context.data.allowedMentions.users.push(user.id);
        return user.mention;
    }
}
