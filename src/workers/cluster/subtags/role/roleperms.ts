import { BBTagContext, Subtag } from '@cluster/bbtag';
import { RoleNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class RolePermsSubtag extends Subtag {
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
                    returns: 'number',
                    execute: (ctx, [userId, quiet]) => this.getRolePerms(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRolePerms(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<bigint> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.permissions.bitfield;
    }
}
