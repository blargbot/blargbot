import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import type { WarningService } from '../../services/WarningService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.pardon;

@Subtag.id('pardon')
@Subtag.ctorArgs('warnings', 'converter', 'users')
export class PardonSubtag extends CompiledSubtag {
    readonly #warnings: WarningService;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(warnings: WarningService, converter: BBTagValueConverter, users: UserService) {
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

        this.#warnings = warnings;
        this.#converter = converter;
        this.#users = users;
    }

    public async pardon(
        context: BBTagScript,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const member = await this.#users.querySingle(context.runtime, userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const count = this.#converter.int(countStr);
        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#warnings.pardon(context.runtime, member, context.runtime.user, count, reason === '' ? 'Tag Pardon' : reason);
    }
}
