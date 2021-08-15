import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleid',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s ID. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role ID is: {roleid;admin}.',
                    exampleOut: 'The admin role ID is: 123456789123456.',
                    execute: (ctx, [roleId, quiet]) => this.getRoleId(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleId(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            return role.id;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
