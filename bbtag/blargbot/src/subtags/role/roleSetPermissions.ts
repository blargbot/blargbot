import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roleSetPermissions;

@Subtag.id('roleSetPermissions', 'roleSetPerms')
@Subtag.ctorArgs('converter', 'roles')
export class RoleSetPermissionsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #roles: RoleService;

    public constructor(converter: BBTagValueConverter, roles: RoleService) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut, //TODO meaningful output
                    returns: 'nothing',
                    execute: (ctx, [role]) => this.roleSetPerms(ctx, role.value, '0', '')
                },
                {
                    parameters: ['role', 'permissions:0', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [role, permissions, quiet]) => this.roleSetPerms(ctx, role.value, permissions.value, quiet.value)
                }
            ]
        });

        this.#converter = converter;
        this.#roles = roles;
    }

    public async roleSetPerms(
        context: BBTagScript,
        roleStr: string,
        permsStr: string,
        quietStr: string
    ): Promise<void> {
        const topRole = context.runtime.roleEditPosition(context.runtime.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = typeof context.runtime.scopes.local.quiet === 'boolean' ? context.runtime.scopes.local.quiet : quietStr !== '';
        const role = await this.#roles.querySingle(context.runtime, roleStr, { noLookup: quiet });
        const perms = this.#converter.bigInt(permsStr) ?? 0n;

        const mappedPerms = perms & context.runtime.authorizerPermissions;

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found');

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#roles.edit(context.runtime, role.id, { permissions: mappedPerms.toString() });

        if (result === undefined || quiet)
            return;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.error);
    }
}
