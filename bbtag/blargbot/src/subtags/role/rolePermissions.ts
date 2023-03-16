import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.rolePermissions;

@Subtag.id('rolePermissions', 'rolePerms')
@Subtag.ctorArgs('roles')
export class RolePermissionsSubtag extends CompiledSubtag {
    readonly #roles: RoleService;

    public constructor(roles: RoleService) {
        super({
            category: SubtagType.ROLE,
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

        this.#roles = roles;
    }

    public async getRolePerms(
        context: BBTagScript,
        roleId: string,
        quiet: boolean
    ): Promise<bigint> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context.runtime, roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return BigInt(role.permissions);
    }
}
