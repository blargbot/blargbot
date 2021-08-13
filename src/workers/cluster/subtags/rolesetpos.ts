import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetpos',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: 'Sets the position of `role`. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role is now at position 3. {rolesetpos;admin;3}',
                    exampleOut: 'The admin role is now at position 3.',
                    execute: async (context, [{value: roleStr}, {value: posStr}, {value: quietStr}], subtag) => {
                        const topRole = discordUtil.getRoleEditPosition(context);
                        if (topRole === 0)
                            return this.customError('Author cannot edit roles', context, subtag);

                        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
                        const role = await context.getRole(roleStr, {
                            quiet, suppress: context.scope.suppressLookup,
                            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
                        });
                        const pos = parse.int(posStr);

                        if (role !== undefined) {
                            if (role.position >= topRole)
                                return this.customError('Role above author', context, subtag);
                            if (pos >= topRole) {
                                return this.customError('Desired position above author', context, subtag);
                            }

                            try {
                                await role.edit({ position: pos});
                                return '`Role not found`'; //TODO meaningful output, this is purely for backwards compatibility :/
                            } catch (err: unknown) {
                                if (!quiet)
                                    return this.customError('Failed to edit role: no perms', context, subtag);
                            }
                        }
                        return this.noRoleFound(context, subtag);
                    }
                }
            ]
        });
    }
}
