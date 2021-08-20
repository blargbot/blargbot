import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class KickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'kick',
            category: SubtagType.API,
            desc: 'If the kick is successful, `Success` will be returned, otherwise the error will be given. ',
            definition: [
                {
                    parameters: ['user'],
                    description: 'Kicks `user`.',
                    exampleCode: '{kick;stupid cat} @stupid cat was kicked!',
                    exampleOut: 'Succes @stupid cat was kicked',
                    execute: (ctx, args, subtag) => this.kickMember(ctx, args[0].value, '', '', subtag)
                },
                {
                    parameters: ['user', 'reason', 'noperms?'],
                    description: 'Kicks `user`. ' +
                        'If `noperms` is provided, do not check if the command executor is actually able to kick people. ' +
                        'Only provide this if you know what you\'re doing.',
                    exampleCode: '{kick;stupid cat;because I can} @stupid cat was kicked!',
                    exampleOut: 'Success @stupid cat was kicked, because I can!',
                    execute: (ctx, args, subtag) => this.kickMember(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        nopermsStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const user = await context.queryUser(userStr, {
            noErrors: context.scope.noLookupErrors, noLookup: true //TODO why?
        });

        const noPerms = nopermsStr !== '' ? true : false;
        if (user === undefined)
            return this.noUserFound(context, subtag);
        const member = await context.util.getMember(context.guild.id, user.id);
        if (member === undefined)
            return this.noUserFound(context, subtag);

        const response = await context.util.cluster.moderation.bans.kick(member, context.user, noPerms, reason);

        const error = (message: string): string => this.customError(message, context, subtag);
        switch (response) {
            case 'success': //Successful
                return 'Success'; //TODO true/false response
            case 'noPerms': //Bot doesnt have perms
                return error('I don\'t have permission to kick users!');
            case 'memberTooHigh': //Bot cannot kick target
                return error(`I don't have permission to kick ${user.username}!`);
            case 'moderatorNoPerms': //User doesnt have perms
                return error('You don\'t have permission to kick users!');
            case 'moderatorTooLow': //User cannot kick target
                return error(`You don't have permission to kick ${user.username}!`);
        }
    }
}
