import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildSize;

export interface GetGuildMemberCountThunk {
    (guildId: string): Promise<number>;
}

export class GuildSizeSubtag extends CompiledSubtag {
    readonly #getGuildMemberCount: GetGuildMemberCountThunk;
    public constructor({ getGuildMemberCount }: { getGuildMemberCount: GetGuildMemberCountThunk; }) {
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
        this.#getGuildMemberCount = getGuildMemberCount;
    }

    public async getMemberCount(context: BBTagContext): Promise<number> {
        return await this.#getGuildMemberCount(context.root.guildId);
    }
}
