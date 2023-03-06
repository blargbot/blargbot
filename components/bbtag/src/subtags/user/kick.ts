import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.kick;

@Subtag.names('kick')
@Subtag.ctorArgs('user')
export class KickSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user]) => this.kickMember(ctx, user.value, '', false)
                },
                {
                    parameters: ['user', 'reason', 'noPerms?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user, reason, noPerms]) => this.kickMember(ctx, user.value, reason.value, noPerms.value !== '')
                }
            ]
        });

        this.#users = users;
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const user = await this.#users.querySingle(context, userStr, { noLookup: true /* TODO why? */ });
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Kick';

        const authorizer = noPerms ? context.authorizer : context.user;
        const response = await this.#users.kick(user, context.user, authorizer, reason);

        switch (response) {
            case 'success': //Successful
                return 'Success'; //TODO true/false response
            case 'noPerms': //Bot doesnt have perms
                throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!');
            case 'memberTooHigh': //Bot cannot kick target
                throw new BBTagRuntimeError('Bot has no permissions', `I don't have permission to kick ${user.username}!`);
            case 'moderatorNoPerms': //User doesnt have perms
                throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!');
            case 'moderatorTooLow': //User cannot kick target
                throw new BBTagRuntimeError('User has no permissions', `You don't have permission to kick ${user.username}!`);
        }
    }
}
