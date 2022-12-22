import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { RoleNotFoundError } from '@bbtag/engine';

export class RolePositionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rolePosition',
            category: SubtagType.ROLE,
            aliases: ['rolePos'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
