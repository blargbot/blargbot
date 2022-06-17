import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserAvatarSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'useravatar',
            category: SubtagType.USER,
            description: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the avatar of the executing user.',
                    exampleCode: 'Your avatar is {useravatar}',
                    exampleOut: 'Your discrim is (avatar url)',
                    returns: 'string',
                    execute: (ctx) => this.getUserAvatarUrl(ctx, '', true)
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
        if (member !== undefined)
            return member.avatarURL;

        const user = await context.util.getUser(userId);
        if (user !== undefined)
            return user.avatarURL;

        throw new UserNotFoundError(userId)
            .withDisplay(quiet ? '' : undefined);
    }
}
