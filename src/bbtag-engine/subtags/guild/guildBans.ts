import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildBans;

export interface GetBannedUsersFeature {
    getBannedUsers(guildId: string): Promise<readonly string[] | undefined>;
}

type Features = GetBannedUsersFeature;
export class GuildBansSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'guildBans',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildBans(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildBans(context: BBTagContext): Promise<readonly string[]> {
        return await this.#features.getBannedUsers(context.root.guildId)
            ?? new BBTagRuntimeError('Missing required permissions').throw();
    }
}
