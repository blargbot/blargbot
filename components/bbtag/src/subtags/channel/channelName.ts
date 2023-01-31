import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelName;

@Subtag.names('channelName', 'categoryName')
@Subtag.ctorArgs(Subtag.service('channel'))
export class ChannelNameSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getChannelName(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'string',
                    execute: (ctx, [channel, quiet]) => this.getChannelName(ctx, channel.value, quiet.value !== '')
                }
            ]
        });

        this.#channels = channels;
    }

    public async getChannelName(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await this.#channels.querySingle(context, channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return channel.name;
    }
}
