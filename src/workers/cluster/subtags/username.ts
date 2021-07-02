import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, SubtagType } from '../core';

export class UserNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'username',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the username of the executing user.',
                    exampleCode: 'Your username is {username}!',
                    exampleOut: 'Your username is Cool Dude 1337!',
                    execute: (ctx) => ctx.user.username.replace(/@/g, '@\u200b')
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s username. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s username is {username;Stupid cat}!',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    execute: (ctx, args) => this.getUserName(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserName(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            return user.username.replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}