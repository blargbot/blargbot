import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { TimezoneProvider } from '../../services/TimezoneProvider.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.userTimeZone;

@Subtag.id('userTimeZone')
@Subtag.ctorArgs('timezones', 'users')
export class UserTimezoneSubtag extends CompiledSubtag {
    readonly #timezones: TimezoneProvider;
    readonly #users: UserService;

    public constructor(timezones: TimezoneProvider, users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getUserTimezone(ctx, '', false)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserTimezone(ctx, userId.value, quiet.value !== '')
                }
            ]
        });

        this.#timezones = timezones;
        this.#users = users;
    }

    public async getUserTimezone(
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

        return await this.#timezones.get(context.runtime, user.id) ?? 'UTC';
    }
}
