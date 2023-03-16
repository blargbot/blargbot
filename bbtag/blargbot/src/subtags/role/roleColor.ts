import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleColor;

@Subtag.id('roleColor')
@Subtag.ctorArgs('roles')
export class RoleColorSubtag extends CompiledSubtag {
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
                    returns: 'hex',
                    execute: (ctx, [roleId, quiet]) => this.getRoleHexColor(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });

        this.#roles = roles;
    }

    public async getRoleHexColor(
        context: BBTagScript,
        roleId: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context.runtime, roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.color;
    }
}
