import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildIcon;

export interface GetGuildIconFeature {
    getGuildIcon(guildId: string): Promise<URL | null | undefined>;
}
type Features = GetGuildIconFeature;
export class GuildIconSubtag extends CompiledSubtag {
    readonly #features: GetGuildIconFeature;
    public constructor(features: Features) {
        super({
            name: 'guildIcon',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string|nothing',
                    execute: (ctx) => this.getGuildIcon(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildIcon(context: BBTagContext): Promise<string | undefined> {
        return (await this.#features.getGuildIcon(context.root.guildId))?.toString();
    }
}
