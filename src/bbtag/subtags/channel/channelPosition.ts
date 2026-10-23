import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelPosition;

export interface GetChannelPositionThunk {
    (guildId: string, channelId: string): Promise<number | 'thread' | undefined>;
}

export class ChannelPositionSubtag extends CompiledSubtag {
    readonly #getChannelPosition: GetChannelPositionThunk;
    public constructor({ getChannelPosition }: { getChannelPosition: GetChannelPositionThunk; }) {
        super({
            name: 'channelPosition',
            aliases: ['channelPos', 'categoryPosition', 'categoryPos'],
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'number',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
        this.#getChannelPosition = getChannelPosition;
    }

    public async currentChannel(context: BBTagContext): Promise<number> {
        const result = await this.#getChannelPosition(context.root.guildId, context.local.message.channel.id)
            ?? new ChannelNotFoundError(context.local.message.channel.id).throw();
        if (result === 'thread')
            this.#throwIsThread(context.local.message.channel.id);
        return result;
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<number> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        const result = await this.#getChannelPosition(context.root.guildId, channelId)
            ?? new ChannelNotFoundError(context.local.message.channel.id).withDisplay(quiet ? '' : undefined).throw();
        if (result === 'thread')
            this.#throwIsThread(channelId);
        return result;
    }

    #throwIsThread(channelId: string): never {
        throw new BBTagRuntimeError('Threads dont have a position', `<#${channelId}> is a thread and doesnt have a position`);
    }
}
