import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleColorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolecolor',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s hex color code. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role color is: #{rolecolor;admin}.',
                    exampleOut: 'The admin role ID is: #1b1b1b.',
                    execute: (ctx, [roleId, quiet]) => this.getRoleHexColor(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleHexColor(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            return role.color.toString(16).padStart(6, '0');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
