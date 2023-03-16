import { isCategoryChannel } from '@blargbot/discord-util';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelCategories;

@Subtag.id('channelCategories', 'categories')
@Subtag.ctorArgs('channels')
export class ChannelCategoriesSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
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

        this.#channels = channels;
    }

    public async getChannelCategories(context: BBTagScript): Promise<string[]> {
        const channels = await this.#channels.getAll(context.runtime);
        return channels.filter(isCategoryChannel).map(c => c.id);
    }
}
