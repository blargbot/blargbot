import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserRolesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userroles',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the roles of the executing user.',
                    exampleCode: 'Your roles are {userroles}!',
                    exampleOut: 'Your roles are ["1111111111111111","2222222222222222"]!',
                    execute: (ctx) => JSON.stringify(ctx.member.roles)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s roles as an array. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s roles are {userroles;stupidcat}',
                    exampleOut: 'Stupid cat\'s roles are ["1111111111111111","2222222222222222", "3333333333333333"]',
                    execute: (ctx, [userId, quiet]) => this.getUserRoles(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserRoles(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            const member = await context.util.getMember(context.guild, user.id);
            if (member !== undefined)
                return JSON.stringify([...member.roles.cache.keys()]);
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
