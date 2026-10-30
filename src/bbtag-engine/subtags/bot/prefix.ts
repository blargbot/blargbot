import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.prefix;

export interface GetPrefixFeature {
    get defaultPrefix(): string;
    getPrefix(guildId: string): Promise<string | readonly string[] | undefined>;
}

type Features = GetPrefixFeature;
export class PrefixSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'prefix',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getPrefix(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getPrefix(context: BBTagContext): Promise<string> {
        if (context.root.prefix !== undefined)
            return context.root.prefix;

        const result = await this.#features.getPrefix(context.root.guildId) ?? this.#features.defaultPrefix;
        if (Array.isArray(result))
            return result[0];
        return result;
    }
}
