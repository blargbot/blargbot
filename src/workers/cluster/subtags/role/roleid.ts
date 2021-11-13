import { BBTagContext, Subtag } from '@cluster/bbtag';
import { RoleNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class RoleIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleid',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s ID. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role ID is: {roleid;admin}.',
                    exampleOut: 'The admin role ID is: 123456789123456.',
                    returns: 'id',
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
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            // We dont want this error to appear in the output
            context.scopes.local.fallback = '';
            throw new RoleNotFoundError(roleId);
        }

        return role.id;
    }
}
