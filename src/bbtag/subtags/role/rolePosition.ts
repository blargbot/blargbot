import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.rolePosition;

export interface GetRolePositionFeature {
    getRolePosition(guildId: string, roleId: string): Promise<number | undefined>;
}

type Features = GetRolePositionFeature;
export class RolePositionSubtag extends CompiledSubtag {
    readonly #features: GetRolePositionFeature;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async getRolePosition(
        context: BBTagContext,
        roleStr: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getRolePosition(context.root.guildId, roleId)
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
