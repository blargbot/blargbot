import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelName;

export interface GetChannelNameFeature {
    getChannelName(guildId: string, channelId: string): Promise<string | undefined>;
}

type Features = GetChannelNameFeature;
export class ChannelNameSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelName',
            aliases: ['categoryName'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'string',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async currentChannel(context: BBTagContext): Promise<string> {
        return await this.#features.getChannelName(context.root.guildId, context.local.message.channel.id) ?? 'unknown';
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.#features.getChannelName(context.root.guildId, channelId) ?? 'unknown';
    }
}
