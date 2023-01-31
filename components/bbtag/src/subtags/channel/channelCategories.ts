import { guard } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelCategories;

@Subtag.names('channelCategories', 'categories')
@Subtag.ctorArgs(Subtag.service('channel'))
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

    public async getChannelCategories(context: BBTagContext): Promise<string[]> {
        const channels = await this.#channels.getAll(context);
        return channels.filter(guard.isCategoryChannel).map(c => c.id);
    }
}
