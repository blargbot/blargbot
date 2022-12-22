import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { RoleNotFoundError } from '@bbtag/engine';

export class RoleNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleName',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [roleId, quiet]) => this.getRoleName(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleName(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        return role.name;
    }
}
