import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleDelete;

@Subtag.names('roleDelete')
@Subtag.ctorArgs(Subtag.service('role'))
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

    public async deleteRole(context: BBTagContext, roleStr: string, quiet: boolean): Promise<void> {
        const topRole = context.roleEditPosition(context.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot delete roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context, roleStr, {
            noErrors: quiet,
            noLookup: quiet
        });

        if (role === undefined) {
            throw new RoleNotFoundError(roleStr)
                .withDisplay(quiet ? '' : undefined);
        }

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#roles.delete(context, role.id);

        if (result === undefined || quiet)
            return;

        throw new BBTagRuntimeError('Failed to delete role: no perms', result.error);
    }
}
