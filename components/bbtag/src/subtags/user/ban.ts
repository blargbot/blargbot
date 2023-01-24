import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.ban;

const errorMap = {
    'noPerms': 'Bot has no permissions',
    'memberTooHigh': 'Bot has no permissions',
    'moderatorNoPerms': 'User has no permissions',
    'moderatorTooLow': 'User has no permissions'
};

@Subtag.id('ban')
@Subtag.factory(Subtag.util(), Subtag.converter())
export class BanSubtag extends CompiledSubtag {
    #util: BBTagUtilities;
    #converter: BBTagValueConverter;
    public constructor(util: BBTagUtilities, converter: BBTagValueConverter) {
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

        this.#util = util;
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
        const user = await context.queryUser(userStr, {
            noLookup: true, noErrors: context.scopes.local.noLookupErrors ?? false
        });

        if (user === undefined)
            throw new UserNotFoundError(userStr);
        const daysToDelete = this.#converter.int(daysToDeleteStr);
        if (daysToDelete === undefined) {
            throw new NotANumberError(daysToDeleteStr)
                .withDisplay('false');
        }
        let duration = moment.duration(Infinity);

        if (timeToUnbanStr !== '')
            duration = this.#converter.duration(timeToUnbanStr) ?? duration;

        if (reason === '')
            reason = 'Tag Ban';

        const authorizer = noPerms ? context.authorizer?.user ?? context.user : context.user;
        const response = await this.#util.ban(context.guild, user, context.user, authorizer, daysToDelete, reason, duration);
        if (response === 'success' || response === 'alreadyBanned')
            return duration.asMilliseconds() < Infinity ? duration.asMilliseconds() : true;
        throw new BBTagRuntimeError(errorMap[response]);
    }
}
