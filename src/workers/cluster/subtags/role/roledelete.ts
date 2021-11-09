import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleDeleteSubtag extends BaseSubtag {
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
                    execute: async (context, [{ value: roleStr }, { value: quietStr }]): Promise<string | void> => {
                        const topRole = discordUtil.getRoleEditPosition(context);
                        if (topRole === 0)
                            throw new BBTagRuntimeError('Author cannot delete roles');

                        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
                        const role = await context.queryRole(roleStr, {
                            noErrors: quiet,
                            noLookup: quiet
                        });

                        if (role !== undefined) {
                            if (role.position >= topRole)
                                throw new BBTagRuntimeError('Role above author');

                            try {
                                const reason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
                                await role.delete(reason);
                                //TODO meaningful output
                            } catch (err: unknown) {
                                context.logger.error(err);
                                throw new BBTagRuntimeError('Failed to delete role: no perms');
                            }
                        }
                    }
                }
            ]
        });
    }
}
