import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import type { WarningService } from '../../services/WarningService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.warnings;

@Subtag.names('warnings')
@Subtag.ctorArgs('warnings', 'user')
export class WarningsSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #warnings: WarningService;

    public constructor(warnings: WarningService, users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (context, [user, quiet]) => this.getUserWarnings(context, user.value, quiet.value !== '')
                }
            ]
        });

        this.#warnings = warnings;
        this.#users = users;
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const user = await this.#users.querySingle(context, userQuery, { noLookup: quiet });

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await this.#warnings.count(context, user);
    }
}
