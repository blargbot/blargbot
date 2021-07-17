import { BaseSubtag, SubtagType, BBTagContext } from '@cluster/core';

export class RoleIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleid',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s ID. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role ID is: {roleid;admin}.',
                    exampleOut: 'The admin role ID is: 123456789123456.',
                    execute: (ctx, [roleId, quietStr]) => this.getRoleId(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRoleId(
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
            return role.id;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
