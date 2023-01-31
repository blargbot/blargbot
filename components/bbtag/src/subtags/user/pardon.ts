import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.pardon;

@Subtag.names('pardon')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter(), Subtag.service('user'))
export class PardonSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter, users: UserService) {
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
        this.#users = users;
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const member = await this.#users.querySingle(context, userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const count = this.#converter.int(countStr);
        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#util.pardon(member, context.user, count, reason === '' ? 'Tag Pardon' : reason);
    }
}
