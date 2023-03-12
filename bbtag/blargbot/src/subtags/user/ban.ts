import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { resolveDuration, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.ban;

const errorMap = {
    'noPerms': 'Bot has no permissions',
    'memberTooHigh': 'Bot has no permissions',
    'moderatorNoPerms': 'User has no permissions',
    'moderatorTooLow': 'User has no permissions'
};

@Subtag.names('ban')
@Subtag.ctorArgs('user', 'converter')
export class BanSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #converter: BBTagValueConverter;

    public constructor(users: UserService, converter: BBTagValueConverter) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user', 'daysToDelete?:1'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays]) => this.banMember(ctx, user.value, deleteDays.value, '', '', false)
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays, reason, unbanAfter]) => this.banMember(ctx, user.value, deleteDays.value, reason.value, unbanAfter.value, false)
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban', 'noPerms'],
                    description: tag.noPerms.description,
                    exampleCode: tag.noPerms.exampleCode,
                    exampleOut: tag.noPerms.exampleOut,
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays, reason, unbanAfter, noPerms]) => this.banMember(ctx, user.value, deleteDays.value, reason.value, unbanAfter.value, noPerms.value !== '')
                }
            ]
        });

        this.#users = users;
        this.#converter = converter;
    }

    public async banMember(
        context: BBTagContext,
        userStr: string,
        daysToDeleteStr: string,
        reason: string,
        timeToUnbanStr: string,
        noPerms: boolean
    ): Promise<boolean | number> {
        const user = await this.#users.querySingle(context, userStr, { noLookup: true });

        if (user === undefined)
            throw new UserNotFoundError(userStr);

        const daysToDelete = this.#converter.int(daysToDeleteStr);
        if (daysToDelete === undefined) {
            throw new NotANumberError(daysToDeleteStr)
                .withDisplay('false');
        }

        const duration = resolveDuration(this.#converter.duration(timeToUnbanStr))?.asMilliseconds() ?? Infinity;

        if (reason === '')
            reason = 'Tag Ban';

        const authorizer = noPerms ? context.authorizer : context.user;
        const response = await this.#users.ban(context.guild, user, context.user, authorizer, daysToDelete, reason, duration);
        if (response === 'success' || response === 'alreadyBanned')
            return duration < Infinity ? duration : true;
        throw new BBTagRuntimeError(errorMap[response]);
    }
}
