import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { RoleNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleColorSubtag extends CompiledSubtag {
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
                    returns: 'hex',
                    execute: (ctx, [roleId, quiet]) => this.getRoleHexColor(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleHexColor(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.color;
    }
}
