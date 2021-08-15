import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserRolesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userroles',
            category: SubtagType.API,
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
                    execute: (ctx, [userId, quietStr]) => this.getUserRoles(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserRoles(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });

        if (user !== undefined) {
            const member = await context.util.getMemberById(context.guild, user.id);
            if (member !== undefined)
                return JSON.stringify([...member.roles.cache.keys()]);
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
