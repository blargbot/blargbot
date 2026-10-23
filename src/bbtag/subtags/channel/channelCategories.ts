import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelCategories;

export interface GetCategoryChannelsThunk {
    (guildId: string): Promise<readonly string[]>;
}

export class ChannelCategoriesSubtag extends CompiledSubtag {
    readonly #getCategoryChannels: GetCategoryChannelsThunk;
    public constructor({ getCategoryChannels }: { getCategoryChannels: GetCategoryChannelsThunk; }) {
        super({
            name: 'channelCategories',
            category: SubtagType.CHANNEL,
            aliases: ['categories'],
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getChannelCategories(ctx)
                }
            ]
        });
        this.#getCategoryChannels = getCategoryChannels;
    }

    public async getChannelCategories(context: BBTagContext): Promise<readonly string[]> {
        return await this.#getCategoryChannels(context.root.guildId);
    }
}
