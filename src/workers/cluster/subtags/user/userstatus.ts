import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserStatusSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userstatus',
            category: SubtagType.USER,
            desc: 'Returned status can be one of `online`, `idle`, `dnd` or `offline`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the status of the user.',
                    exampleCode: 'You are currently {userstatus}',
                    exampleOut: 'You are currently online',
                    execute: (ctx) => ctx.member.presence?.status ?? 'offline'
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the status of `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is currently {userstatus;stupid cat}',
                    exampleOut: 'Stupid cat is currently online',
                    execute: (ctx, [userId, quiet]) => this.getUserStatus(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserStatus(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            const member = await context.util.getMember(context.guild, user.id);
            if (member !== undefined)
                return member.presence?.status ?? 'offline';
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
