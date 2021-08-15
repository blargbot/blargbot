import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleMembersSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolemembers',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns an array of members in `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admins are: {rolemembers;Admin}.',
                    exampleOut: 'The admins are: ["11111111111111111","22222222222222222"].',
                    execute: (ctx, [roleId, quiet]) => this.getRoleMembers(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleMembers(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            const membersInRole = (await context.guild.roles.fetch(role.id))?.members;
            return JSON.stringify(membersInRole?.map(m => m.user.id) ?? []);
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
