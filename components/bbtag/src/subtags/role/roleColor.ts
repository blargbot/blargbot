import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleColor;

@Subtag.id('roleColor')
@Subtag.factory()
export class RoleColorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'hex',
                    execute: (ctx, [roleId, quiet]) => this.getRoleHexColor(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getRoleHexColor(
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

        return role.color;
    }
}
