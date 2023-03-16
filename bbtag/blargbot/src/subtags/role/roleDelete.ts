import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleDelete;

@Subtag.id('roleDelete')
@Subtag.ctorArgs('roles')
export class RoleDeleteSubtag extends CompiledSubtag {
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
                    returns: 'nothing',
                    execute: (ctx, [role, quiet]) => this.deleteRole(ctx, role.value, quiet.value !== '')
                }
            ]
        });

        this.#roles = roles;
    }

    public async deleteRole(context: BBTagScript, roleStr: string, quiet: boolean): Promise<void> {
        const topRole = context.runtime.roleEditPosition(context.runtime.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot delete roles');

        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context.runtime, roleStr, {
            noErrors: quiet,
            noLookup: quiet
        });

        if (role === undefined) {
            throw new RoleNotFoundError(roleStr)
                .withDisplay(quiet ? '' : undefined);
        }

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#roles.delete(context.runtime, role.id);

        if (result === undefined || quiet)
            return;

        throw new BBTagRuntimeError('Failed to delete role: no perms', result.error);
    }
}
