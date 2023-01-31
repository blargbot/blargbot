import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.slowMode;

@Subtag.names('slowMode')
@Subtag.ctorArgs(Subtag.converter(), Subtag.service('channel'))
export class SlowModeSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;

    public constructor(converter: BBTagValueConverter, channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.clearCurrent.description,
                    exampleCode: tag.clearCurrent.exampleCode,
                    exampleOut: tag.clearCurrent.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.setSlowmode(ctx, ctx.channel.id, '0')
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

        this.#converter = converter;
        this.#channels = channels;
    }

    public async setSlowmode(
        context: BBTagContext,
        channelStr: string,
        timeStr: string
    ): Promise<void> {
        let time = this.#converter.int(timeStr);
        let channel;
        const lookupChannel = await this.#channels.querySingle(context, channelStr, { noLookup: true });//TODO yikes
        if (lookupChannel !== undefined)
            channel = lookupChannel;
        else {
            channel = context.channel;
            time = this.#converter.int(channelStr);
        }

        if (time === undefined)
            time = 0;

        time = Math.min(time, 21600);

        const result = await this.#channels.edit(context, channel.id, { rateLimitPerUser: time });
        if (result === undefined)
            return;

        throw new BBTagRuntimeError('Missing required permissions', result.error);
    }
}