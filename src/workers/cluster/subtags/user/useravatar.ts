import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
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
                    returns: 'string',
                    execute: (ctx) => ctx.user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the avatar of `user`. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s avatar is {useravatar;Stupid cat}',
                    exampleOut: 'Stupid cat\'s avatar is (avatar url)',
                    returns: 'string',
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
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            // We dont want this error to appear in the output
            context.scopes.local.fallback = '';
            throw new UserNotFoundError(userId);
        }

        return member.displayAvatarURL({ dynamic: true, format: 'png', size: 512 });
    }
}
