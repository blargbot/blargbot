import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.pardon;

@Subtag.id('pardon')
@Subtag.factory(Subtag.util(), Subtag.converter())
export class PardonSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user]) => this.pardon(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.pardon(ctx, user.value, count.value, reason.value)
                }
            ]
        });

        this.#util = util;
        this.#converter = converter;
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const member = await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const count = this.#converter.int(countStr);
        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#util.pardon(member, context.user, count, reason === '' ? 'Tag Pardon' : reason);
    }
}
