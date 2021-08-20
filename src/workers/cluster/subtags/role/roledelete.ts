import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleDeleteSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roledelete',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing.\nWarning: this subtag is able to delete roles managed by integrations.',
                    exampleCode: '{roledelete;Super Cool Role!}',
                    exampleOut: '(rip no more super cool roles for anyone)',
                    execute: async (context, [{value: roleStr}, {value: quietStr}], subtag): Promise<string | void> => {
                        const topRole = discordUtil.getRoleEditPosition(context);
                        if (topRole === 0)
                            return this.customError('Author cannot delete roles', context, subtag);

                        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
                        const role = await context.queryRole(roleStr, {
                            noErrors: quiet,
                            noLookup: quiet
                        });

                        if (role !== undefined) {
                            if (role.position >= topRole)
                                return this.customError('Role above author', context, subtag);

                            try {
                                const reason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                                await role.delete(reason);
                                //TODO meaningful output
                            } catch (err: unknown) {
                                context.logger.error(err);
                                return this.customError('Failed to delete role: no perms', context, subtag);
                            }
                        }
                    }
                }
            ]
        });
    }
}
