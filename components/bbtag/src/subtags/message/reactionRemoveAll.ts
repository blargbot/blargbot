import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.reactionRemoveAll;

@Subtag.id('reactionRemoveAll', 'reactRemoveAll', 'removeReactAll')
@Subtag.factory()
export class ReactionRemoveAllSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['channel?', 'messageId'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, message]) => this.removeAllReactions(ctx, channel.value, message.value)
                }
            ]
        });
    }

    public async removeAllReactions(context: BBTagContext, channelStr: string, messageId: string): Promise<void> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.getMessage(channel, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        const permissions = channel.permissionsOf(context.discord.user.id);
        if (!permissions.has('manageMessages'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!(await context.isStaff || context.ownsMessage(message.id)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        await message.removeReactions();
        //TODO meaningful output please
    }
}
