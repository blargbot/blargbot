import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { RoleNotFoundError } from '@cluster/bbtag/errors';
import { /*parse,*/ SubtagType } from '@cluster/utils'; //TODO uncomment parse module for new code

export class RoleSizeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesize',
            category: SubtagType.ROLE,
            aliases: ['inrole'],
            definition: [
                {
                    parameters: ['role'/*, 'quiet?:false'*/], //TODO uncomment quiet parameter for new code
                    description: 'Returns the amount of people in role `role`',
                    exampleCode: 'There are {rolesize;11111111111111111} people in the role!',
                    exampleOut: 'There are 5 people in the role!',
                    returns: 'number',
                    execute: (ctx, [role/*, quiet */]) => this.getRoleSize(ctx, role.value/*, quiet.value !== '' */)
                }
            ]
        });
    }

    public async getRoleSize(context: BBTagContext, roleStr: string/*, quiet: boolean*/): Promise<number> {
        /* quiet ||= context.scopes.local.quiet ?? false */
        /* const role = await context.queryRole(roleStr, {
            quiet
        }) */
        const role = await context.util.getRole(context.guild.id, roleStr);

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        return context.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
    }
}
