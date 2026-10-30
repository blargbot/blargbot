import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from '../user/userId.js';

const tag = templates.subtags.roles;
export interface ListMemberRolesFeature {
    listMemberRoles(guildId: string, userId: string): Promise<readonly string[] | undefined>;
}
export interface ListGuildRolesFeature {
    listGuildRoles(guildId: string): Promise<readonly string[]>;
}

type Features = ListMemberRolesFeature & ListGuildRolesFeature;
export class RolesSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roles',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: [],
                    description: tag.guild.description,
                    exampleCode: tag.guild.exampleCode,
                    exampleOut: tag.guild.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildRoles(ctx)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [userId, quiet]) => this.getUserRoles(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildRoles(context: BBTagContext): Promise<readonly string[]> {
        return await this.#features.listGuildRoles(context.root.guildId);
    }

    public async getUserRoles(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<readonly string[]> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.listMemberRoles(context.root.guildId, userId)
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
