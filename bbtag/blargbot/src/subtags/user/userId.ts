import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.userId;

@Subtag.id('userId')
@Subtag.ctorArgs('users')
export class UserIdSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getUserId(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'id',
                    execute: (ctx, [userId, quiet]) => this.getUserId(ctx, userId.value, quiet.value !== '')
                }
            ]
        });

        this.#users = users;
    }

    public async getUserId(
        context: BBTagScript,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context.runtime, userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return user.id;
    }
}
