import { isTextableChannel } from '@blargbot/discord-util';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.lastMessageId;

@Subtag.id('lastMessageId')
@Subtag.ctorArgs('channels')
export class LastMessageIdSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id|nothing',
                    execute: (ctx) => this.getLastMessageID(ctx, ctx.runtime.channel.id)
                },
                {
                    parameters: ['channel'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id|nothing',
                    execute: (ctx, [channel]) => this.getLastMessageID(ctx, channel.value)
                }
            ]
        });

        this.#channels = channels;
    }

    public async getLastMessageID(
        context: BBTagScript,
        channelStr: string
    ): Promise<string | undefined> {
        const channel = await this.#channels.querySingle(context.runtime, channelStr);

        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (!isTextableChannel(channel))
            throw new BBTagRuntimeError('Channel must be a textable channel');

        return 'last_message_id' in channel ? channel.last_message_id ?? undefined : undefined;
    }
}
