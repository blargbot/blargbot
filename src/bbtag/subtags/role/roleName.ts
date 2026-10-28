import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.roleName;

export interface GetRoleNameFeature {
    getRoleName(guildId: string, roleId: string): Promise<string | undefined>;
}

type Features = GetRoleNameFeature;
export class RoleNameSubtag extends CompiledSubtag {
    readonly #features: GetRoleNameFeature;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async getRoleName(
        context: BBTagContext,
        roleStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getRoleName(context.root.guildId, roleId)
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
