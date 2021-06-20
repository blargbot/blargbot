import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UserIdSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userid',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the user ID of the executing user.',
                    exampleCode: 'Your id is {userid}',
                    exampleOut: 'Your id is 123456789123456',
                    execute: (ctx) => ctx.user.id
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s ID. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'This is Stupid cat\'s user ID {userid;Stupid cat}',
                    exampleOut: 'This is Stupid cat\'s user ID 103347843934212096',
                    execute: (ctx, args) => this.getUserId(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserId(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            return user.id;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}