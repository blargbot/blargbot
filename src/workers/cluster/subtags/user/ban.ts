import { Cluster } from '@cluster';
import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { Duration } from 'moment';

// 'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'
const errorMap = {
    'noPerms': 'Bot has no permissions',
    'memberTooHigh': 'Bot has no permissions',
    'moderatorNoPerms': 'User has no permissions',
    'moderatorTooLow': 'User has no permissions'
    //'alreadyBanned': 'User has already been banned' //TODO JS blarg returns true for this
};

export class BanSubtag extends Subtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
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
                    execute: (ctx, args) => this.banMember(ctx, args[0].value, args[1].value, 'Tag Ban', '', '')
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban?'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`.',
                    exampleCode: '{ban;Stupid cat;;Not clicking enough kittens;30d}',
                    exampleOut: 'true (stupid cat will be unbanned after 30d)',
                    returns: 'boolean|number',
                    execute: (ctx, args) => this.banMember(ctx, args[0].value, args[1].value, args[2].value, args[3].value, '')
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban', 'noPerms'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`. If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people.' +
                        'Only provide this if you know what you\'re doing.',
                    exampleCode: '{ban;Stupid cat;;For being stupid;;anythingcangohere}',
                    exampleOut: 'true (anyone can use this cc regardless of perms)',
                    returns: 'boolean|number',
                    execute: (ctx, args) => this.banMember(ctx, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value)
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
            context.scopes.local.fallback = 'false';
            throw new NotANumberError(daysToDelete);
        }
        const noPerms = nopermsStr !== '' ? true : false;
        let duration: Duration | undefined;

        if (timeToUnbanStr !== '')
            duration = parse.duration(timeToUnbanStr);

        const response = await this.cluster.moderation.bans.ban(context.guild, user, context.discord.user, noPerms, daysToDelete, reason, duration);

        if (response === 'success' || response === 'alreadyBanned')
            return duration !== undefined ? duration.asMilliseconds() : true;
        throw new BBTagRuntimeError(errorMap[response]);
    }
}
