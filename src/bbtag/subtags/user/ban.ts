import { parse } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

const errorMap = {
    'noPerms': 'Bot has no permissions',
    'memberTooHigh': 'Bot has no permissions',
    'moderatorNoPerms': 'User has no permissions',
    'moderatorTooLow': 'User has no permissions'
};

export class BanSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'ban',
            category: SubtagType.USER,
            desc: '`daysToDelete` is the number of days to delete messages for. `duration`',
            definition: [
                {
                    parameters: ['user', 'daysToDelete?:1'],
                    description: 'Bans `user`. If the ban is succesful `true` will be returned, else it will return an error.',
                    exampleCode: '{ban;Stupid cat;4}',
                    exampleOut: 'true',
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays]) => this.banMember(ctx, user.value, deleteDays.value, '', '', '')
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban?'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`.',
                    exampleCode: '{ban;Stupid cat;;Not clicking enough kittens;30d}',
                    exampleOut: 'true (stupid cat will be unbanned after 30d)',
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays, reason, unbanAfter]) => this.banMember(ctx, user.value, deleteDays.value, reason.value, unbanAfter.value, '')
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban', 'noPerms'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people.' +
                        'Only provide this if you know what you\'re doing.',
                    exampleCode: '{ban;Stupid cat;;For being stupid;;anythingcangohere}',
                    exampleOut: 'true (anyone can use this cc regardless of perms)',
                    returns: 'boolean|number',
                    execute: (ctx, [user, deleteDays, reason, unbanAfter, noPerms]) => this.banMember(ctx, user.value, deleteDays.value, reason.value, unbanAfter.value, noPerms.value)
                }
            ]
        });
    }

    public async banMember(
        context: BBTagContext,
        userStr: string,
        daysToDeleteStr: string,
        reason: string,
        timeToUnbanStr: string,
        nopermsStr: string
    ): Promise<boolean | number> {
        const user = await context.queryUser(userStr, {
            noLookup: true, noErrors: context.scopes.local.noLookupErrors ?? false
        });

        if (user === undefined)
            throw new UserNotFoundError(userStr);
        const daysToDelete = parse.int(daysToDeleteStr, false);
        if (daysToDelete === undefined) {
            throw new NotANumberError(daysToDeleteStr)
                .withDisplay('false');
        }
        const noPerms = nopermsStr !== '' ? true : false;
        let duration = moment.duration(Infinity);

        if (timeToUnbanStr !== '')
            duration = parse.duration(timeToUnbanStr) ?? duration;

        if (reason === '')
            reason = 'Tag Ban';

        const response = await context.util.ban(context.guild, user, context.user, !noPerms, daysToDelete, reason, duration);
        if (response === 'success' || response === 'alreadyBanned')
            return duration.asMilliseconds() < Infinity ? duration.asMilliseconds() : true;
        throw new BBTagRuntimeError(errorMap[response]);
    }
}
