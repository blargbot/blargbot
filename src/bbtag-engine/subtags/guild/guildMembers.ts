import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildMembers;

export interface ListGuildMembersFeature {
    listGuildMembers(guildId: string): Promise<readonly string[]>;
}

type Features = ListGuildMembersFeature
export class GuildMembersSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'guildMembers',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getMembers(ctx)
                }
            ]
        });
        this.#features = features;
    }

    public async getMembers(context: BBTagContext): Promise<readonly string[]> {
        return await this.#features.listGuildMembers(context.root.guildId);
    }
}
