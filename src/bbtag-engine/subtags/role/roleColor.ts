import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.roleColor;

export interface GetRoleColorFeature {
    getRoleColor(guildId: string, roleId: string): Promise<number | undefined>;
}

type Features = GetRoleColorFeature;
export class RoleColorSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleColor',
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
        this.#features = features;
    }

    public async getRoleHexColor(
        context: BBTagContext,
        roleStr: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getRoleColor(context.root.guildId, roleId)
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
