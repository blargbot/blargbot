import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserDiscrimSubtag extends BaseSubtag {
    public constructor() {
        super({
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
                    execute: (ctx, [userId, quietStr]) => this.getUserDiscrim(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserDiscrim(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });

        if (user !== undefined)
            return user.discriminator;

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
