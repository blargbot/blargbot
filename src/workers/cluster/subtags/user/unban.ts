import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class UnbanSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'unban',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['user'],
                    description: 'Unbans `user`.',
                    exampleCode: '{unban;@user} @user was unbanned!',
                    exampleOut: '@user was unbanned!',
                    execute: (ctx, args, subtag) => this.unbanUser(ctx, args[0].value, '', '', subtag)
                },
                {
                    parameters: ['user', 'reason', 'noPerms?'],
                    description: 'Unbans `user` with the given `reason`.' +
                        'If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to ban people. ' +
                        'Only provide this if you know what you\'re doing.',
                    exampleCode: '{unban;@stupid cat;I made a mistake} @stupid cat has been unbanned',
                    exampleOut: 'true @stupid cat has been unbanned',
                    execute: (ctx, args, subtag) => this.unbanUser(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async unbanUser(
        context: BBTagContext,
        userStr: string,
        reason: string,
        nopermsStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const user = await context.queryUser(userStr, { noErrors: context.scope.noLookupErrors});
        const noPerms = nopermsStr !== '';

        if (user === undefined)
            return this.noUserFound(context, subtag);

        const result = await context.util.cluster.moderation.bans.unban(context.guild, user, context.user, noPerms, reason);

        const error = (message: string): string => this.customError(message, context, subtag);

        switch (result) {
            case 'success':
                return 'true';
            case 'moderatorNoPerms':
                return error('User has no permissions');
            case 'noPerms':
                return error('Bot has no permissions');
            case 'notBanned':
                return 'false';
        }
    }
}
