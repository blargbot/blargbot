import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToDuration, convertToInteger } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.ban;

export interface BanUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly auditReason: string;
    readonly daysToDelete: number;
    readonly unbanAfter?: Temporal.Duration;
}

export type BanUserResult = ApiResult<null, { cause: 'bot' | 'authorizer'; }>;

export interface BanUserFeature {
    banUser(options: BanUserOptions): Promise<BanUserResult>;
}

type Features = BanUserFeature
export class BanSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'ban',
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
        this.#features = features;
    }

    public async banMember(
        context: BBTagContext,
        userStr: string,
        daysToDeleteStr: string,
        reason: string,
        timeToUnbanStr: string,
        noPerms: boolean
    ): Promise<boolean | number> {
        const targetId = await UserIdSubtag.query(context, userStr, {
            noLookup: true,
            global: true
        }) ?? new UserNotFoundError(userStr).throw();
        const daysToDelete = convertToInteger(daysToDeleteStr);
        if (daysToDelete === undefined) {
            throw new NotANumberError(daysToDeleteStr)
                .withDisplay('false');
        }
        const duration = timeToUnbanStr === '' ? undefined : convertToDuration(timeToUnbanStr);

        if (reason === '')
            reason = 'Tag Ban';

        const authorizerId = noPerms ? context.root.authorizerId : context.root.userId;
        const result = await this.#features.banUser({
            guildId: context.root.guildId,
            targetId,
            moderatorId: context.root.userId,
            authorizerId,
            daysToDelete,
            auditReason: reason,
            unbanAfter: duration
        });
        if (result.success)
            return duration?.total({ unit: 'milliseconds', relativeTo: Temporal.Now.zonedDateTimeISO() }) ?? true;
        switch (result.cause) {
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions', result.reason);
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions', result.reason);
            default:
                throw new BBTagRuntimeError('Ban failed', result.reason);
        }
    }
}
