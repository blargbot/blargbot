import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleSetColor;

@Subtag.id('roleSetColor')
@Subtag.factory(Subtag.converter())
export class RoleSetColorSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolecolor(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'color', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, color, quiet]) => this.setRolecolor(ctx, role.value, color.value, quiet.value !== '')
                }
            ]
        });

        this.#converter = converter;
    }

    public async setRolecolor(
        context: BBTagContext,
        roleStr: string,
        colorStr: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const color = this.#converter.color(colorStr !== '' ? colorStr : 0);

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found'); //TODO RoleNotFoundError instead

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ color }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
