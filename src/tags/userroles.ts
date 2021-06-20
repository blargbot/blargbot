import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UserRolesSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userroles',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the roles of the executing user.',
                    exampleCode: 'Your roles are {userroles}!',
                    exampleOut: 'Your roles are ["1111111111111111","2222222222222222"]!',
                    execute: (ctx) => JSON.stringify(ctx.member.roles)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s roles as an array. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s roles are {userroles;stupidcat}',
                    exampleOut: 'Stupid cat\'s roles are ["1111111111111111","2222222222222222", "3333333333333333"]',
                    execute: (ctx, args) => this.getUserRoles(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserRoles(
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
                return JSON.stringify(member.roles);
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}