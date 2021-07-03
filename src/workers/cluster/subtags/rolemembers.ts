import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RoleMembersSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rolemembers',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns an array of members in `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admins are: {rolemembers;Admin}.',
                    exampleOut: 'The admins are: ["11111111111111111","22222222222222222"].',
                    execute: (ctx, [roleId, quietStr]) => this.getRoleMembers(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRoleMembers(
        context: BBTagContext,
        roleId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const role = await context.getRole(roleId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (role !== undefined) {
            const membersInRole = context.guild.members.filter(m => m.roles.includes(role.id));
            return JSON.stringify(membersInRole.map(m => m.user.id));
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
