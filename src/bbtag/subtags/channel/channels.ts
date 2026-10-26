import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channels;

export interface ListChannelsFeature {
    listChannels(guildId: string, parentId?: string): Promise<readonly string[]>;
}

type Features = ListChannelsFeature;
export class ChannelsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channels',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getAllChannels(ctx)
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [category, quiet]) => this.getChannelsInCategory(ctx, category.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getAllChannels(context: BBTagContext): Promise<readonly string[]> {
        return await this.#features.listChannels(context.root.guildId);
    }

    public async getChannelsInCategory(context: BBTagContext, channelStr: string, quiet: boolean): Promise<readonly string[]> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.#features.listChannels(context.root.guildId, channelId);
    }
}
