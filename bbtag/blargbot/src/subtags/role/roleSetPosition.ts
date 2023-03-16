import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roleSetPosition;

@Subtag.id('roleSetPosition', 'roleSetPos')
@Subtag.ctorArgs('converter', 'roles')
export class RoleSetPositionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #roles: RoleService;

    public constructor(converter: BBTagValueConverter, roles: RoleService) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, position, quiet]) => this.setRolePosition(ctx, role.value, position.value, quiet.value !== '')
                }
            ]
        });

        this.#converter = converter;
        this.#roles = roles;
    }

    public async setRolePosition(context: BBTagScript, roleStr: string, positionStr: string, quiet: boolean): Promise<boolean> {
        const topRole = context.runtime.roleEditPosition(context.runtime.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const role = await this.#roles.querySingle(context.runtime, roleStr, { noLookup: quiet });
        const pos = this.#converter.int(positionStr);
        if (pos === undefined)
            throw new NotANumberError(positionStr);

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');
        if (pos >= topRole)
            throw new BBTagRuntimeError('Desired position above author');

        const result = await this.#roles.edit(context.runtime, role.id, { position: pos });
        if (result === undefined)
            return true;

        if (quiet)
            return false;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.error);
    }
}
