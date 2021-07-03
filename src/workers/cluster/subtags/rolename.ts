import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RoleNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rolename',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role name is: {rolename;admin}.',
                    exampleOut: 'The admin role name is: Adminstrator.',
                    execute: (ctx, [roleId, quietStr]) => this.getRoleName(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRoleName(
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
            return role.name;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
