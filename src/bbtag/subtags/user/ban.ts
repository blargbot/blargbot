import { parse } from '@blargbot/core';
import type moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';

const tag = templates.subtags.ban;

export interface BanUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
    readonly daysToDelete: number;
    readonly unbanAfter?: moment.Duration;
}

export type BanUserResult = ApiResult<null, { cause: 'bot' | 'authorizer'; }>;

export interface BanUserThunk {
    (options: BanUserOptions): Promise<BanUserResult>;
}

export class BanSubtag extends CompiledSubtag {
    readonly #banUser: BanUserThunk;
    public constructor({ banUser }: { banUser: BanUserThunk; }) {
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
        this.#banUser = banUser;
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
            noLookup: true, noErrors: context.local.noLookupErrors ?? false
        });

        if (user === undefined)
            throw new UserNotFoundError(userStr);
        const daysToDelete = parse.int(daysToDeleteStr);
        if (daysToDelete === undefined) {
            throw new NotANumberError(daysToDeleteStr)
                .withDisplay('false');
        }
        const duration = timeToUnbanStr === '' ? undefined : parse.duration(timeToUnbanStr);

        if (reason === '')
            reason = 'Tag Ban';

        const authorizer = noPerms ? context.root.authorizer?.user ?? context.root.message.author : context.root.message.author;
        const result = await this.#banUser({
            guildId: context.root.guildId,
            targetId: user.id,
            moderatorId: context.root.message.author.id,
            authorizerId: authorizer.id,
            daysToDelete,
            reason,
            unbanAfter: duration
        });
        if (result.success)
            return duration?.asMilliseconds() ?? true;
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
