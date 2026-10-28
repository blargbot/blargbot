import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildName;

export interface GetGuildNameFeature {
    getGuildName(guildId: string): Promise<string | undefined>;
}

type Features = GetGuildNameFeature;
export class GuildNameSubtag extends CompiledSubtag {
    readonly #features: GetGuildNameFeature;
    public constructor(features: Features) {
        super({
            name: 'guildName',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getGuildName(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildName(context: BBTagContext): Promise<string> {
        return await this.#features.getGuildName(context.root.guildId) ?? '';
    }
}
