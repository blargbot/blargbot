import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelIsNsfw;

export interface IsChannelNsfwFeature {
    isChannelNsfw(guildId: string, channelId: string): Promise<boolean | undefined>;
}

type Features = IsChannelNsfwFeature;
export class ChannelIsNsfwSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelIsNsfw',
            category: SubtagType.CHANNEL,
            aliases: ['isNsfw'],
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'boolean',
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public static async check(context: BBTagContext, channelId: string): Promise<boolean> {
        return await context.engine.getSubtag(ChannelIsNsfwSubtag).check(context, channelId);
    }

    public async check(context: BBTagContext, channelId: string): Promise<boolean> {
        return await this.#features.isChannelNsfw(context.root.guildId, channelId) ?? false;
    }

    public async currentChannel(context: BBTagContext): Promise<boolean> {
        return await this.check(context, context.local.message.channel.id);
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<boolean> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.check(context, channelId);
    }
}
