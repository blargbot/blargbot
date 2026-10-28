import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildFeatures;

export interface ListGuildFeaturesFeature {
    listGuildFeatures(guildId: string): Promise<readonly string[] | undefined>;
}

type Features = ListGuildFeaturesFeature;
export class GuildFeaturesSubtag extends CompiledSubtag {
    readonly #features: ListGuildFeaturesFeature;
    public constructor(features: Features) {
        super({
            name: 'guildFeatures',
            category: SubtagType.GUILD,
            aliases: ['features'],
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.getGuildFeatures(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildFeatures(context: BBTagContext): Promise<readonly string[]> {
        return await this.#features.listGuildFeatures(context.root.guildId) ?? [];
    }
}
