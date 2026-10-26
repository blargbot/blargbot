import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelType } from '../../enums.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';
import type { GetChannelTypeFeature } from './channelType.js';

const tag = templates.subtags.channelIsThread;

type Features = GetChannelTypeFeature;
export class ChannelIsThreadSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelIsThread',
            aliases: ['isThread'],
            category: SubtagType.CHANNEL,
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
        return await context.engine.getSubtag(ChannelIsThreadSubtag).check(context, channelId);
    }

    public async check(context: BBTagContext, channelId: string): Promise<boolean> {
        return channelTypes.has(await this.#features.getChannelType(context.root.guildId, channelId));
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
const channelTypes = new Set([
    ChannelType.ANNOUNCEMENT_THREAD,
    ChannelType.PUBLIC_THREAD,
    ChannelType.PRIVATE_THREAD
]);
