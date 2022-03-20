import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ReactRemoveAllSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'reactremoveall',
            category: SubtagType.MESSAGE,
            aliases: ['removereactall'],
            definition: [
                {
                    parameters: ['channel?', 'messageId'],
                    description: 'Removes all reactions from `messageId`.\n`channelId` defaults to the current channel.',
                    exampleCode: '{reactremoveall;12345678901234;:thinking:}',
                    exampleOut: '(removed all the reactions)',
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

        const message = await context.util.getMessage(channel, messageId);
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
