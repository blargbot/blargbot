import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import type { WarningService } from '../../services/WarningService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.warn;

@Subtag.names('warn')
@Subtag.ctorArgs('converter', 'warnings', 'user')
export class WarnSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #warnings: WarningService;
    readonly #users: UserService;

    public constructor(converter: BBTagValueConverter, warnings: WarningService, users: UserService) {
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
                    execute: (ctx, [user]) => this.warnUser(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.warnUser(ctx, user.value, count.value, reason.value)
                }
            ]
        });

        this.#converter = converter;
        this.#warnings = warnings;
        this.#users = users;
    }

    public async warnUser(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const count = this.#converter.int(countStr);

        const user = await this.#users.querySingle(context, userStr);

        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#warnings.warn(context, user, context.user, count, reason !== '' ? reason : 'Tag Warning');
    }
}
