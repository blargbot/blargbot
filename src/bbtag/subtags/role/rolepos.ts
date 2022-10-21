import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { RoleNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rolepos;

export class RolePosSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolepos',
            category: SubtagType.ROLE,
            aliases: ['roleposition'],
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
