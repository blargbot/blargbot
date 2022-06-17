import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { RoleNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleNameSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolename',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role name is: {rolename;admin}.',
                    exampleOut: 'The admin role name is: Adminstrator.',
                    returns: 'string',
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
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.name;
    }
}
