import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleSize;

@Subtag.id('roleSize', 'inRole')
@Subtag.factory(Subtag.util())
export class RoleSizeSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'/*, 'quiet?:false'*/], //TODO uncomment quiet parameter for new code
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [role/*, quiet */]) => this.getRoleSize(ctx, role.value/*, quiet.value !== '' */)
                }
            ]
        });
        this.#util = util;
    }

    public async getRoleSize(context: BBTagContext, roleStr: string/*, quiet: boolean*/): Promise<number> {
        /* quiet ||= context.scopes.local.quiet ?? false */
        /* const role = await context.queryRole(roleStr, {
            quiet
        }) */
        const role = await context.queryRole(roleStr, { noLookup: true, noErrors: true });
        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        await this.#util.ensureMemberCache(context.guild);
        return context.guild.members.filter(m => m.roles.includes(role.id)).length;
    }
}
