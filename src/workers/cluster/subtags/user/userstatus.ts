import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserStatusSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userstatus',
            category: SubtagType.API,
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
                    execute: (ctx, [userId, quietStr]) => this.getUserStatus(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserStatus(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });

        if (user !== undefined) {
            const member = await context.util.getMemberById(context.guild, user.id);
            if (member !== undefined)
                return member.presence?.status ?? 'offline';
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
