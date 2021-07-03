import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

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
                    execute: (ctx, [userId, quietStr]) => this.getUserId(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserId(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (user !== undefined) {
            return user.id;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
