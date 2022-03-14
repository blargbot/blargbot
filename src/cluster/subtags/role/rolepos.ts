import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { RoleNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { SubtagType } from '@blargbot/cluster/utils';

export class RolePosSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'rolepos',
            category: SubtagType.ROLE,
            aliases: ['roleposition'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.\n**Note**: the highest role will have the highest position, and the lowest role will have the lowest position and therefore return `0` (`@everyone`).',
                    exampleCode: 'The position of Mayor is {rolepos;Mayor}',
                    exampleOut: 'The position of Mayor is 10',
                    returns: 'number',
                    execute: (ctx, [roleId, quiet]) => this.getRolePosition(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRolePosition(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.position;
    }
}
