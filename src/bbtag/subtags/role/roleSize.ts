import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { /*parse,*/ SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.roleSize;

export interface GetRoleMemberCountFeature {
    getRoleMemberCount(guildId: string, roleId: string): Promise<number>;
}

type Features = GetRoleMemberCountFeature
export class RoleSizeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleSize',
            category: SubtagType.ROLE,
            aliases: ['inRole'],
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
        this.#features = features;
    }

    public async getRoleSize(context: BBTagContext, roleStr: string/*, quiet: boolean*/): Promise<number> {
        /* quiet ||= context.local.quiet ?? false */
        /* const role = await context.queryRole(roleStr, {
            quiet
        }) */
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: true, noErrors: true })
            ?? new RoleNotFoundError(roleStr).throw();

        return await this.#features.getRoleMemberCount(context.root.guildId, roleId);
    }
}
