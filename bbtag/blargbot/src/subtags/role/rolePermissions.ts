import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { RoleNotFoundError } from '@bbtag/engine';

export class RolePermissionsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rolePermissions',
            category: SubtagType.ROLE,
            aliases: ['rolePerms'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [userId, quiet]) => this.getRolePerms(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRolePerms(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<bigint> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.permissions.allow;
    }
}
