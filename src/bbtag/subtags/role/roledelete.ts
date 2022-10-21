import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.roledelete;

export class RoleDeleteSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roledelete',
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
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to delete role: no perms', err.message);
        }
    }
}
