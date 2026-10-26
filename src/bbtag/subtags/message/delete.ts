import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import { ChannelIsTextSubtag } from '../channel/channelIsText.js';
import type { ApiResult } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';

const tag = templates.subtags.delete;

export type DeleteMessageResult = ApiResult<null, { cause: 'notFound' | 'failed'; }>;

export interface DeleteMessageFeature {
    deleteMessage(channelId: string, messageId: string): Promise<DeleteMessageResult>;
}

type Features = DeleteMessageFeature
export class DeleteSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'delete',
            description: tag.description,
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.deleteMessage(ctx, ctx.local.message.channel.id, ctx.local.message.id)
                },
                {
                    parameters: ['messageId'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [messageId]) => this.deleteMessage(ctx, ctx.local.message.channel.id, messageId.value)
                },
                {
                    parameters: ['channel', 'messageId'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, messageId]) => this.deleteMessage(ctx, channel.value, messageId.value)
                }
            ]
        });
        this.#features = features;
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<void> {
        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');

        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();

        if (messageId.length === 0 || !await ChannelIsTextSubtag.check(context, channelId))
            throw new MessageNotFoundError(channelId, messageId).withDisplay('');

        const result = await this.#features.deleteMessage(channelId, messageId);
        //TODO return something like true/false
        if (result.success)
            return;

        switch (result.cause) {
            case 'notFound':
                throw new MessageNotFoundError(channelId, messageId).withDisplay('');
            case 'failed':
                throw new BBTagRuntimeError('Delete failed', result.reason).withDisplay('');
        }
    }
}
