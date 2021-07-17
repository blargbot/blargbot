import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleColorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolecolor',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s hex color code. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role color is: #{rolecolor;admin}.',
                    exampleOut: 'The admin role ID is: #1b1b1b.',
                    execute: (ctx, [roleId, quietStr]) => this.getRoleHexColor(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRoleHexColor(
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
            return role.color.toString(16).padStart(6, '0');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
