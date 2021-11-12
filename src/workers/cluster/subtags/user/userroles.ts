import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
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
                    returns: 'id[]',
                    execute: (ctx) => ctx.member.roles.cache.map(r => r.id)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s roles as an array. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s roles are {userroles;stupidcat}',
                    exampleOut: 'Stupid cat\'s roles are ["1111111111111111","2222222222222222", "3333333333333333"]',
                    returns: 'id[]',
                    execute: (ctx, [userId, quiet]) => this.getUserRoles(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserRoles(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<Iterable<string>> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            // We dont want this error to appear in the output
            context.scopes.local.fallback = '';
            throw new UserNotFoundError(userId);
        }

        return member.roles.cache.keys();
    }
}
