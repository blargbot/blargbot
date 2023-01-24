import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleSetPermissions;

@Subtag.id('roleSetPermissions', 'roleSetPerms')
@Subtag.ctorArgs(Subtag.converter())
export class RoleSetPermissionsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
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
    }

    public async roleSetPerms(
        context: BBTagContext,
        roleStr: string,
        permsStr: string,
        quietStr: string
    ): Promise<void> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
        const role = await context.queryRole(roleStr, { noLookup: quiet, noErrors: context.scopes.local.noLookupErrors });
        const perms = this.#converter.bigInt(permsStr) ?? 0n;

        const mappedPerms = perms & context.permission.allow;

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found');

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ permissions: mappedPerms }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
