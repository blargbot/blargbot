import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildSize;

export interface GetGuildMemberCountFeature {
    getGuildMemberCount(guildId: string): Promise<number>;
}

type Features = GetGuildMemberCountFeature
export class GuildSizeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'guildSize',
            aliases: ['inGuild'],
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.getMemberCount(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getMemberCount(context: BBTagContext): Promise<number> {
        return await this.#features.getGuildMemberCount(context.root.guildId);
    }
}
