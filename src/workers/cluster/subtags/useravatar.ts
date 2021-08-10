import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserAvatarSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'useravatar',
            category: SubtagType.API,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the avatar of the executing user.',
                    exampleCode: 'Your avatar is {useravatar}',
                    exampleOut: 'Your discrim is (avatar url)',
                    execute: (ctx) => ctx.user.avatarURL({ size: 512, format: 'png', dynamic: true }) ?? ctx.user.defaultAvatarURL
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the avatar of `user`. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s avatar is {useravatar;Stupid cat}',
                    exampleOut: 'Stupid cat\'s avatar is (avatar url)',
                    execute: (ctx, [userId, quietStr]) => this.getUserAvatarUrl(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserAvatarUrl(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (user !== undefined)
            return user.avatarURL({ size: 512, format: 'png', dynamic: true }) ?? user.defaultAvatarURL;

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
