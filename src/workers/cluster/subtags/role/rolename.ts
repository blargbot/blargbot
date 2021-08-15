import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolename',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role name is: {rolename;admin}.',
                    exampleOut: 'The admin role name is: Adminstrator.',
                    execute: (ctx, [roleId, quiet]) => this.getRoleName(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleName(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            return role.name;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
