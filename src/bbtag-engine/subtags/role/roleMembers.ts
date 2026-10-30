import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.roleMembers;

export interface ListRoleMembersFeature {
    listRoleMembers(guildId: string, roleId: string): Promise<readonly string[]>;
}

type Features = ListRoleMembersFeature
export class RoleMembersSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleMembers',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [roleId, quiet]) => this.getRoleMembers(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getRoleMembers(
        context: BBTagContext,
        roleStr: string,
        quiet: boolean
    ): Promise<readonly string[]> {
        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.listRoleMembers(context.root.guildId, roleId);
    }
}
