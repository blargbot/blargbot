import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

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
                    execute: (ctx, [roleId, quiet]) => this.getRolePosition(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRolePosition(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            return role.position.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
