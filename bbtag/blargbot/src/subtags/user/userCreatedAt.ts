import { snowflake } from '@blargbot/discord-util';
import moment from 'moment-timezone';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.userCreatedAt;

@Subtag.id('userCreatedAt')
@Subtag.ctorArgs('users')
export class UserCreatedAtSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserCreatedAt(ctx, format.value, '', true)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, user, quiet]) => this.getUserCreatedAt(ctx, format.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#users = users;

    }

    public async getUserCreatedAt(context: BBTagScript, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context.runtime, userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        const { timestampMs } = snowflake.parse(user.id);
        return moment(timestampMs).utcOffset(0).format(format);
    }
}
