import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class UserStatusSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userstatus',
            category: SubtagType.API,
            desc: 'Returned status can be one of `online`, `idle`, `dnd` or `offline`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the status of the user.',
                    exampleCode: 'You are currently {userstatus}',
                    exampleOut: 'You are currently online',
                    execute: (ctx) => ctx.member.status
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the status of `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is currently {userstatus;stupid cat}',
                    exampleOut: 'Stupid cat is currently online',
                    execute: (ctx, args) => this.getUserStatus(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserStatus(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            const member = context.guild.members.get(user.id);
            if (member)
                return member.status ?? 'offline';
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}