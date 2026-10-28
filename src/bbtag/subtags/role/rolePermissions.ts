import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { DiscordPermissions } from '../../enums.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.rolePermissions;

export interface GetRolePermissionsFeature {
    getRolePermissions(guildId: string, roleId: string): Promise<DiscordPermissions | undefined>;
}

type Features = GetRolePermissionsFeature;
export class RolePermissionsSubtag extends CompiledSubtag {
    readonly #features: GetRolePermissionsFeature;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async getRolePerms(
        context: BBTagContext,
        roleStr: string,
        quiet: boolean
    ): Promise<bigint> {
        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        return (await this.#features.getRolePermissions(context.root.guildId, roleId))?.raw
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
