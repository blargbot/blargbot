import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/subtagType.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelCategory;

export interface GetChannelCategoryFeature {
    getChannelCategory(guildId: string, channelId: string): Promise<string | undefined>;
}

type Features = GetChannelCategoryFeature;
export class ChannelCategorySubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelCategory',
            aliases: ['category'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.currentChannelCategory(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, quiet]) => this.getCategory(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async currentChannelCategory(context: BBTagContext): Promise<string> {
        return await this.#features.getChannelCategory(context.root.guildId, context.local.message.channel.id)
            ?? new BBTagRuntimeError('Channel has no parent').withDisplay('').throw();
    }

    public async getCategory(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.#features.getChannelCategory(context.root.guildId, channelId)
            ?? new BBTagRuntimeError('Channel has no parent').withDisplay('').throw();
    }
}
