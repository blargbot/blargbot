import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { RoleNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class RoleMembersSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'rolemembers',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns an array of members in `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admins are: {rolemembers;Admin}.',
                    exampleOut: 'The admins are: ["11111111111111111","22222222222222222"].',
                    returns: 'id[]',
                    execute: (ctx, [roleId, quiet]) => this.getRoleMembers(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleMembers(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        const members = await context.guild.fetchMembers();
        const membersInRole = members.filter(m => m.roles.includes(role.id));
        return membersInRole.map(m => m.user.id);
    }
}
