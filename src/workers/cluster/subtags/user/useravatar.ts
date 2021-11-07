import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserAvatarSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'useravatar',
            category: SubtagType.USER,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the avatar of the executing user.',
                    exampleCode: 'Your avatar is {useravatar}',
                    exampleOut: 'Your discrim is (avatar url)',
                    execute: (ctx) => ctx.user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the avatar of `user`. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s avatar is {useravatar;Stupid cat}',
                    exampleOut: 'Stupid cat\'s avatar is (avatar url)',
                    execute: (ctx, [userId, quiet]) => this.getUserAvatarUrl(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserAvatarUrl(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined)
            return user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 });

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
