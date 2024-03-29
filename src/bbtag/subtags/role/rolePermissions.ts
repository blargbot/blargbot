import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { RoleNotFoundError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.rolePermissions;

export class RolePermissionsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolePermissions',
            category: SubtagType.ROLE,
            aliases: ['rolePerms'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

        return role.permissions.allow;
    }
}
