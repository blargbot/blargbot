import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildMembers;

export interface ListGuildMembersThunk {
    (guildId: string): Promise<readonly string[]>;
}

export class GuildMembersSubtag extends CompiledSubtag {
    readonly #listGuildMembers: ListGuildMembersThunk;
    public constructor({ listGuildMembers }: { listGuildMembers: ListGuildMembersThunk; }) {
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
        this.#listGuildMembers = listGuildMembers;
    }

    public async getMembers(context: BBTagContext): Promise<readonly string[]> {
        return await this.#listGuildMembers(context.root.guildId);
    }
}
