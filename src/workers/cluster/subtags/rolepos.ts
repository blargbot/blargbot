import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RolePosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolepos',
            category: SubtagType.API,
            aliases: ['roleposition'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.\n**Note**: the highest role will have the highest position, and the lowest role will have the lowest position and therefore return `0` (`@everyone`).',
                    exampleCode: 'The position of Mayor is {rolepos;Mayor}',
                    exampleOut: 'The position of Mayor is 10',
                    execute: (ctx, [roleId, quietStr]) => this.getRolePosition(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async getRolePosition(
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
            return role.position.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
