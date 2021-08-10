import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RolePermsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleperms',
            category: SubtagType.API,
            aliases: ['rolepermissions'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s permission number. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role\'s permissions are: {roleperms;admin}.',
                    exampleOut: 'The admin role\'s permissions are: 8.',
                    execute: (ctx, [userId, quietStr]) => this.getRolePerms(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRolePerms(
        context: BBTagContext,
        roleId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const role = await context.getRole(roleId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (role !== undefined) {
            return role.permissions.bitfield.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
