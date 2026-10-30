import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { EditChannelFeature } from './channelEdit.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.slowMode;

type Features = EditChannelFeature;
export class SlowModeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'slowMode',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.clearCurrent.description,
                    exampleCode: tag.clearCurrent.exampleCode,
                    exampleOut: tag.clearCurrent.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.setSlowmode(ctx, ctx.local.channelId, '0')
                },
                {
                    parameters: ['channel|time'],
                    returns: 'nothing',
                    execute: (ctx, [arg]) => this.setSlowmode(ctx, arg.value, '')
                },
                {
                    parameters: ['channel'],
                    description: tag.clearChannel.description,
                    exampleCode: tag.clearChannel.exampleCode,
                    exampleOut: tag.clearChannel.exampleOut
                },
                {
                    parameters: ['time'],
                    description: tag.setCurrent.description,
                    exampleCode: tag.setCurrent.exampleCode,
                    exampleOut: tag.setCurrent.exampleOut
                },
                {
                    parameters: ['channel', 'time:0'],
                    description: tag.setChannel.description, //TODO thank backwards compatibility
                    exampleCode: tag.setChannel.exampleCode,
                    exampleOut: tag.setChannel.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, time]) => this.setSlowmode(ctx, channel.value, time.value)
                }
            ]
        });
        this.#features = features;
    }

    public async setSlowmode(
        context: BBTagContext,
        channelStr: string,
        timeStr: string
    ): Promise<void> {
        let time = convertToInteger(timeStr);
        let channelId;
        const lookupChannel = await ChannelIdSubtag.query(context, channelStr, { noLookup: true });//TODO yikes
        if (lookupChannel !== undefined)
            channelId = lookupChannel;
        else {
            channelId = context.local.channelId;
            time = convertToInteger(channelStr);
        }

        time ??= 0;
        time = Math.min(time, 21600);

        const result = await this.#features.editChannel({
            guildId: context.root.guildId,
            channelId,
            rateLimitPerUser: time,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Missing required permissions', result.reason);
    }
}
