import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleSetName;

@Subtag.id('roleSetName')
@Subtag.ctorArgs('roles')
export class RoleSetNameSubtag extends CompiledSubtag {
    readonly #roles: RoleService;

    public constructor(roles: RoleService) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, name, quiet]) => this.setRolename(ctx, role.value, name.value, quiet.value !== '')
                }
            ]
        });

        this.#roles = roles;
    }

    public async setRolename(
        context: BBTagScript,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = context.runtime.roleEditPosition(context.runtime.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context.runtime, roleStr, { noLookup: quiet });

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#roles.edit(context.runtime, role.id, { name });

        if (result === undefined || quiet)
            return;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.error);
    }
}
