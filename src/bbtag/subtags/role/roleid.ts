import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { RoleNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleIdSubtag extends CompiledSubtag {
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
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.id;
    }
}
