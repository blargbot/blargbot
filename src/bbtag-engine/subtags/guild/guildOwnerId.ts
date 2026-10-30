import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildOwnerId;

export interface GetGuildOwnerIdFeature {
    getGuildOwnerId(guildId: string): Promise<string | undefined>;
}

type Features = GetGuildOwnerIdFeature;
export class GuildOwnerIdSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'guildOwnerId',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getGuildOwnerId(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildOwnerId(context: BBTagContext): Promise<string> {
        return await this.#features.getGuildOwnerId(context.root.guildId) ?? '';
    }
}
