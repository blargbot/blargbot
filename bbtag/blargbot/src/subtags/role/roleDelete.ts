import * as Eris from 'eris';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@bbtag/engine';

export class RoleDeleteSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleDelete',
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
    }

    public async deleteRole(context: BBTagContext, roleStr: string, quiet: boolean): Promise<void> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot delete roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, {
            noErrors: quiet,
            noLookup: quiet
        });

        if (role === undefined) {
            throw new RoleNotFoundError(roleStr)
                .withDisplay(quiet ? '' : undefined);
        }

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.delete(context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to delete role: no perms', err.message);
        }
    }
}
