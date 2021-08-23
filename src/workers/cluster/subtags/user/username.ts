import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'username',
            category: SubtagType.USER,
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
                    execute: (ctx, [userId, quiet]) => this.getUserName(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserName(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            return user.username.replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
