import * as Eris from 'eris';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@bbtag/engine';

export class RoleSetNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleSetName',
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
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ name }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
