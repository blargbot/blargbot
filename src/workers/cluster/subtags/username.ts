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
                    execute: (ctx, [userId, quietStr]) => this.getUserName(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserName(
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
            return user.username.replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
