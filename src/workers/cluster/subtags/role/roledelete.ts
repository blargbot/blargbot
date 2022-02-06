import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleDeleteSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'roledelete',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing.\nWarning: this subtag is able to delete roles managed by integrations.',
                    exampleCode: '{roledelete;Super Cool Role!}',
                    exampleOut: '(rip no more super cool roles for anyone)',
                    returns: 'nothing',
                    execute: (ctx, [role, quiet]) => this.deleteRole(ctx, role.value, quiet.value !== '')
                }
            ]
        });
    }

    public async deleteRole(context: BBTagContext, roleStr: string, quiet: boolean): Promise<void> {
        const topRole = discordUtil.getRoleEditPosition(context.authorizer);
        if (topRole === 0)
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
            const reason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.delete(reason);
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to delete role: no perms');
        }
    }
}
