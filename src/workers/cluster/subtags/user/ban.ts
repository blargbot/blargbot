import { Cluster } from '@cluster';
import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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

export class BanSubtag extends BaseSubtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({
            name: 'ban',
            category: SubtagType.API,
            desc: '`daysToDelete` is the number of days to delete messages for. `duration`',
            definition: [
                {
                    parameters: ['user', 'daysToDelete?:1'],
                    description: 'Bans `user`. If the ban is succesful `true` will be returned, else it will return an error.',
                    exampleCode: '{ban;Stupid cat;4}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.banMember(ctx, args[0].value, args[1].value, 'Tag Ban', '', '', subtag)
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban?'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`.',
                    exampleCode: '{ban;Stupid cat;;Not clicking enough kittens;30d}',
                    exampleOut: 'true (stupid cat will be unbanned after 30d)',
                    execute: (ctx, args, subtag) => this.banMember(ctx, args[0].value, args[1].value, args[2].value, args[3].value, '', subtag)
                },
                {
                    parameters: ['user', 'daysToDelete:1', 'reason', 'timeToUnban', 'noperms'],
                    description: 'Bans `user` for duration `timeToUnban` with `reason`.',
                    exampleCode: '{ban;Stupid cat;;For being stupid;;anythingcangohere}',
                    exampleOut: 'true (anyone can use this cc regardless of perms)',
                    execute: (ctx, args, subtag) => this.banMember(ctx, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value, subtag)
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
        nopermsStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const user = await context.queryUser(userStr, {
            noLookup: true, noErrors: context.scope.noLookupErrors ?? false
        });

        if (user === undefined)
            return this.noUserFound(context, subtag);
        const daysToDelete = parse.int(daysToDeleteStr);
        if (isNaN(daysToDelete))
            return 'false'; //TODO this.notANumber(context, subtag)
        const noPerms = nopermsStr !== '' ? true : false;
        let duration: Duration | undefined;

        if (timeToUnbanStr !== '')
            duration = parse.duration(timeToUnbanStr);

        const response = await this.cluster.moderation.bans.ban(context.guild, user, context.discord.user, noPerms, daysToDelete, reason, duration);

        if (response === 'success' || response === 'alreadyBanned')
            return duration !== undefined ? duration.asMilliseconds().toString() : 'true';
        return this.customError(errorMap[response], context, subtag);
    }
}

// const Builder = require('../structures/TagBuilder');

// module.exports =
//     Builder.APITag('ban')
//         .withArgs(a => [
//             a.required('user'),
//             a.optional('daysToDelete'),
//             a.optional('reason'),
//             a.optional('timeToUnban'),
//             a.optional('noperms')
//         ]).withDesc('Bans `user`. ' +
//             'This functions the same as the ban command. ' +
//             'If the ban is successful, `Success` will be returned, unless a duration was provided in which case the duration in ms will be returned' +
//             'If `noperms` is provided, do not check if the command executor is actually able to ban people. ' +
//             'Only provide this if you know what you\'re doing.'
//         ).withExample(
//             '{ban;stupid cat;0;This is a test ban} @stupid cat was banned!',
//             'Success @stupid cat was banned!'
//         )
//         .whenArgs(0, Builder.errors.notEnoughArguments)
//         .whenArgs('1-5', async function (subtag, context, args) {
//             const user = await context.getUser(args[0], {
//                 quiet: true, suppress: context.scope.suppressLookup,
//                 label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName || 'unknown'}\``
//             });

//             if (!user)
//                 return Builder.errors.noUserFound(subtag, context);

//             const noPerms = args[4] ? true : false;
//             let duration;

//             if (args[3])
//                 duration = bu.parseDuration(args[3]);

//             const response = await CommandManager.built['ban'].ban(
//                 context.msg,
//                 user,
//                 args[1],
//                 args[2] || context.scope.reason || undefined,
//                 duration,
//                 true,
//                 noPerms
//             );

//             if (typeof response[1] === 'string' && response[1].startsWith('`'))
//                 return Builder.util.error(subtag, context, response[1]);

//             return response[1];
//         })
//         .whenDefault(Builder.errors.tooManyArguments)
//         .build();
