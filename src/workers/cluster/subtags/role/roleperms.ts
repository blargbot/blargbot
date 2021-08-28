import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RolePermsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleperms',
            category: SubtagType.ROLE,
            aliases: ['rolepermissions'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s permission number. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role\'s permissions are: {roleperms;admin}.',
                    exampleOut: 'The admin role\'s permissions are: 8.',
                    execute: (ctx, [userId, quiet]) => this.getRolePerms(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRolePerms(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            return role.permissions.bitfield.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
