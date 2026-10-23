import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelIsNsfw;

export interface IsChannelNsfwThunk {
    (guildId: string, channelId: string): Promise<boolean | undefined>;
}

export class ChannelIsNsfwSubtag extends CompiledSubtag {
    readonly #isChannelNsfw: IsChannelNsfwThunk;
    public constructor({ isChannelNsfw }: { isChannelNsfw: IsChannelNsfwThunk; }) {
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
        this.#isChannelNsfw = isChannelNsfw;
    }

    public async currentChannel(context: BBTagContext): Promise<boolean> {
        return await this.#isChannelNsfw(context.root.guildId, context.local.message.channel.id) ?? false;
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<boolean> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.#isChannelNsfw(context.root.guildId, channelId) ?? false;
    }
}
