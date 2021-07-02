import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class UserDiscrimSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userdiscrim',
            category: SubtagType.API,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the discriminator of the executing user.',
                    exampleCode: 'Your discrim is {userdiscrim}',
                    exampleOut: 'Your discrim is 1234',
                    execute: (ctx) => ctx.user.discriminator
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s discriminator. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s discriminator is {userdiscrim;Stupid cat}',
                    exampleOut: 'Stupid cat\'s discriminator is 8160',
                    execute: (ctx, args) => this.getUserDiscrim(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserDiscrim(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user)
            return user.discriminator;

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}