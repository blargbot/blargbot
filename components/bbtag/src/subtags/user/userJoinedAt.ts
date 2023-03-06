import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.userJoinedAt;

@Subtag.names('userJoinedAt')
@Subtag.ctorArgs('user')
export class UserJoinedAtSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserJoinDate(ctx, format.value, '', false)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, userId, quiet]) => this.getUserJoinDate(ctx, format.value, userId.value, quiet.value !== '')
                }
            ]
        });

        this.#users = users;
    }

    public async getUserJoinDate(
        context: BBTagContext,
        format: string,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context, userId, { noLookup: quiet });

        if (user?.member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return moment(user.member.joined_at).utcOffset(0).format(format);
    }
}
